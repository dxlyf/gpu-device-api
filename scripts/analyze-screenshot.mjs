#!/usr/bin/env node
/**
 * 截图像素统计小工具：解码 PNG、按 canvas rect 裁剪、统计「背景色占比」与背景连通域。
 *
 * 为什么需要它：页面内的 `canvas.toDataURL()` / `drawImage` 读回**不可信**。
 * 本仓库的示例都带 `contextAttributes.preserveDrawingBuffer: false`，按 WebGL 规范
 * 合成（compositing）之后的 drawing buffer 内容会变成未定义；`drawImage` 复制到的
 * 往往是一整块黑，于是「黑色像素比例」这种指标会被算成全屏 —— 结论完全反过来。
 * 只有真实合成出来的截图（Chrome `--screenshot`、用户提供的截屏）才是可信输入。
 *
 * 用法：
 *   node scripts/analyze-screenshot.mjs <图片.png> [选项]
 *
 * 选项：
 *   --crop x,y,w,h       只统计这块矩形（页面报告 canvas rect 时用；默认整图）
 *   --exclude x,y,w,h    从统计里挖掉这块矩形（通常是页面底部的 status/footer 文本条）
 *   --bg r,g,b           背景色（0-255；默认按 `--clear` 从清屏色换算）
 *   --clear r,g,b        清屏色（线性 0-1，例如 core 页的 0.043,0.055,0.075）
 *   --tolerance n        与背景色的最大逐通道差（默认 14）
 *   --top n              打印前 n 个背景连通域（默认 5）
 *   --components         输出每个背景连通域的大小/包围盒（默认打印汇总）
 *   --fg                 额外统计「前景连通域」（可数出画面上有多少个互不相连的实例）
 *   --json [文件]        额外写一份 JSON（不写文件名时只打印到 stdout）
 *
 * 例：
 *   node scripts/analyze-screenshot.mjs shot.png --crop 0,0,966,594 --clear 0.043,0.055,0.075
 *
 * 退出码：0 = 统计完成；1 = 参数错误或 PNG 解码失败。
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

/* ------------------------------------------------------------------------------------------------ */
/* 参数解析                                                                                            */
/* ------------------------------------------------------------------------------------------------ */

/** 解析 `x,y,w,h` 形式的矩形。 */
function parseRect(text, name) {
  const parts = String(text)
    .split(',')
    .map((piece) => Number(piece.trim()));
  if (parts.length !== 4 || parts.some((value) => !Number.isFinite(value))) {
    throw new Error(`[gpu-device-api] analyze-screenshot: ${name} 需要 x,y,w,h 四个数字，收到 "${text}"。`);
  }
  return { x: Math.trunc(parts[0]), y: Math.trunc(parts[1]), w: Math.trunc(parts[2]), h: Math.trunc(parts[3]) };
}

/** 解析 `r,g,b` 形式的三通道颜色。 */
function parseColor(text, name) {
  const parts = String(text)
    .split(',')
    .map((piece) => Number(piece.trim()));
  if (parts.length !== 3 || parts.some((value) => !Number.isFinite(value))) {
    throw new Error(`[gpu-device-api] analyze-screenshot: ${name} 需要 r,g,b 三个数字，收到 "${text}"。`);
  }
  return parts.map((value) => Math.round(value));
}

const argv = process.argv.slice(2);
if (argv.length === 0 || argv[0].startsWith('--')) {
  console.error(
    '[gpu-device-api] analyze-screenshot: 用法 node scripts/analyze-screenshot.mjs <图片.png> ' +
      '[--crop x,y,w,h] [--exclude x,y,w,h] [--bg r,g,b | --clear r,g,b] [--tolerance n] [--top n] [--json [文件]]',
  );
  process.exit(1);
}

const options = {
  file: argv[0],
  crop: null,
  excludes: [],
  bg: null,
  tolerance: 14,
  top: 5,
  json: null,
  wantJson: false,
  foreground: false,
};
for (let index = 1; index < argv.length; index += 1) {
  const arg = argv[index];
  if (arg === '--crop') options.crop = parseRect(argv[(index += 1)], '--crop');
  else if (arg === '--exclude') options.excludes.push(parseRect(argv[(index += 1)], '--exclude'));
  else if (arg === '--bg') options.bg = parseColor(argv[(index += 1)], '--bg');
  else if (arg === '--clear') {
    // 清屏色是 0-1 的浮点，直接线性放大到 0-255 —— 示例页把清屏色原样写进 rgba8unorm
    // 附件，后端只做「乘以 255 再四舍五入」，这里要保持同一口径。
    // 注意不能先走 --bg 的取整（那会把 0.043 变成 0）。
    const parts = String(argv[(index += 1)])
      .split(',')
      .map((piece) => Number(piece.trim()));
    if (parts.length !== 3 || parts.some((value) => !Number.isFinite(value))) {
      throw new Error('[gpu-device-api] analyze-screenshot: --clear 需要 r,g,b 三个数字。');
    }
    options.bg = parts.map((value) => Math.round(value * 255));
  } else if (arg === '--tolerance') options.tolerance = Number(argv[(index += 1)]);
  else if (arg === '--top') options.top = Number(argv[(index += 1)]);
  else if (arg === '--fg') options.foreground = true;
  else if (arg === '--json') {
    options.wantJson = true;
    const next = argv[index + 1];
    if (next !== undefined && !next.startsWith('--')) {
      options.json = next;
      index += 1;
    }
  } else {
    throw new Error(`[gpu-device-api] analyze-screenshot: 未知参数 "${arg}"。`);
  }
}
if (!options.bg) options.bg = [11, 14, 19]; // 页面 body 背景 #0b0e13，作为兜底
if (!Number.isFinite(options.tolerance) || options.tolerance < 0) {
  throw new Error('[gpu-device-api] analyze-screenshot: --tolerance 必须是非负数。');
}

/* ------------------------------------------------------------------------------------------------ */
/* 最小 PNG 解码器（只依赖 node:zlib；扫描线过滤器按 PNG 规范反演）                                       */
/* ------------------------------------------------------------------------------------------------ */

/** 把每条扫描线前面的过滤器字节按 PNG 规范反演成原始字节。 */
function unfilter(raw, width, height, bytesPerPixel) {
  const stride = width * bytesPerPixel;
  const out = new Uint8Array(stride * height);
  let position = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = raw[position];
    position += 1;
    const lineStart = y * stride;
    const previousStart = lineStart - stride;
    for (let x = 0; x < stride; x += 1) {
      const value = raw[position + x];
      const left = x >= bytesPerPixel ? out[lineStart + x - bytesPerPixel] : 0;
      const up = y > 0 ? out[previousStart + x] : 0;
      const upLeft = y > 0 && x >= bytesPerPixel ? out[previousStart + x - bytesPerPixel] : 0;
      let result;
      switch (filter) {
        case 0:
          result = value;
          break;
        case 1:
          result = value + left;
          break;
        case 2:
          result = value + up;
          break;
        case 3:
          result = value + ((left + up) >> 1);
          break;
        case 4: {
          // Paeth 预测器
          const p = left + up - upLeft;
          const pa = Math.abs(p - left);
          const pb = Math.abs(p - up);
          const pc = Math.abs(p - upLeft);
          result = value + (pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft);
          break;
        }
        default:
          throw new Error(`[gpu-device-api] analyze-screenshot: 未知的 PNG 过滤器 ${filter}。`);
      }
      out[lineStart + x] = result & 0xff;
    }
    position += stride;
  }
  return out;
}

/** 解开 PNG 的 IDAT 数据块。 */
function concatIdat(chunks) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const joined = Buffer.allocUnsafe(total);
  let offset = 0;
  for (const chunk of chunks) {
    chunk.copy(joined, offset);
    offset += chunk.length;
  }
  return joined;
}

/**
 * 解码 PNG → `{ width, height, data }`，`data` 是紧凑的 RGBA8。
 * 支持彩色类型 0（灰度）/2（RGB）/4（灰度+alpha）/6（RGBA）、位深 8，以及彩色类型 3（调色板）。
 */
function decodePng(buffer) {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let index = 0; index < signature.length; index += 1) {
    if (buffer[index] !== signature[index]) {
      throw new Error('[gpu-device-api] analyze-screenshot: 不是 PNG 文件。');
    }
  }
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 8;
  let colorType = 6;
  let interlace = 0;
  let palette = null;
  let transparency = null;
  const idat = [];
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const body = buffer.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;
    if (type === 'IHDR') {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      bitDepth = body[8];
      colorType = body[9];
      interlace = body[12];
    } else if (type === 'PLTE') {
      palette = Buffer.from(body);
    } else if (type === 'tRNS') {
      transparency = Buffer.from(body);
    } else if (type === 'IDAT') {
      idat.push(body);
    } else if (type === 'IEND') {
      break;
    }
  }
  if (interlace !== 0) {
    throw new Error('[gpu-device-api] analyze-screenshot: 暂不支持 Adam7 隔行扫描的 PNG。');
  }
  if (width === 0 || height === 0 || idat.length === 0) {
    throw new Error('[gpu-device-api] analyze-screenshot: PNG 缺少 IHDR/IDAT。');
  }
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
  if (channels === undefined) {
    throw new Error(`[gpu-device-api] analyze-screenshot: 不支持的 PNG 彩色类型 ${colorType}。`);
  }
  if (bitDepth !== 8) {
    throw new Error(`[gpu-device-api] analyze-screenshot: 只支持 8 位深，收到 ${bitDepth}。`);
  }
  const raw = inflateSync(concatIdat(idat));
  const pixels = unfilter(raw, width, height, channels);
  const data = new Uint8Array(width * height * 4);
  for (let index = 0; index < width * height; index += 1) {
    const source = index * channels;
    let r;
    let g;
    let b;
    let a = 255;
    if (colorType === 3) {
      const entry = pixels[source] * 3;
      r = palette[entry];
      g = palette[entry + 1];
      b = palette[entry + 2];
      if (transparency && pixels[source] < transparency.length) a = transparency[pixels[source]];
    } else if (colorType === 0) {
      r = g = b = pixels[source];
    } else if (colorType === 4) {
      r = g = b = pixels[source];
      a = pixels[source + 1];
    } else if (colorType === 2) {
      r = pixels[source];
      g = pixels[source + 1];
      b = pixels[source + 2];
    } else {
      r = pixels[source];
      g = pixels[source + 1];
      b = pixels[source + 2];
      a = pixels[source + 3];
    }
    data[index * 4] = r;
    data[index * 4 + 1] = g;
    data[index * 4 + 2] = b;
    data[index * 4 + 3] = a;
  }
  return { width, height, data };
}

/* ------------------------------------------------------------------------------------------------ */
/* 统计                                                                                               */
/* ------------------------------------------------------------------------------------------------ */

/** 判断一个像素是否「接近背景色」（含 alpha 极低的透明像素，页面上等于露出 body 底色）。 */
function isBackground(data, index, bg, tolerance) {
  if (data[index + 3] < 8) return true;
  return (
    Math.abs(data[index] - bg[0]) <= tolerance &&
    Math.abs(data[index + 1] - bg[1]) <= tolerance &&
    Math.abs(data[index + 2] - bg[2]) <= tolerance
  );
}

/** 用并查集在一张掩码上做 4 邻域连通域标记，返回 `{ sizes, boxes }`（按面积降序）。 */
function connectedComponents(mask, width, height) {
  const label = new Int32Array(width * height).fill(-1);
  const parent = [];
  const find = (value) => {
    let root = value;
    while (parent[root] !== root) root = parent[root];
    while (parent[value] !== root) {
      const next = parent[value];
      parent[value] = root;
      value = next;
    }
    return root;
  };
  const union = (left, right) => {
    const a = find(left);
    const b = find(right);
    if (a !== b) parent[b] = a;
  };
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      if (!mask[index]) continue;
      const up = y > 0 ? label[index - width] : -1;
      const left = x > 0 ? label[index - 1] : -1;
      if (up >= 0 && left >= 0) {
        label[index] = up;
        union(up, left);
      } else if (up >= 0) {
        label[index] = up;
      } else if (left >= 0) {
        label[index] = left;
      } else {
        label[index] = parent.length;
        parent.push(parent.length);
      }
    }
  }
  const sizes = new Map();
  for (let index = 0; index < label.length; index += 1) {
    if (label[index] < 0) continue;
    const root = find(label[index]);
    const entry = sizes.get(root) ?? { size: 0, minX: Infinity, minY: Infinity, maxX: -1, maxY: -1 };
    entry.size += 1;
    const x = index % width;
    const y = (index / width) | 0;
    if (x < entry.minX) entry.minX = x;
    if (y < entry.minY) entry.minY = y;
    if (x > entry.maxX) entry.maxX = x;
    if (y > entry.maxY) entry.maxY = y;
    sizes.set(root, entry);
  }
  return [...sizes.values()].sort((left, right) => right.size - left.size);
}

const image = decodePng(readFileSync(options.file));
const crop = options.crop ?? { x: 0, y: 0, w: image.width, h: image.height };
if (crop.x < 0 || crop.y < 0 || crop.w <= 0 || crop.h <= 0 || crop.x + crop.w > image.width || crop.y + crop.h > image.height) {
  throw new Error(
    `[gpu-device-api] analyze-screenshot: --crop 超出图像范围（图像 ${image.width}x${image.height}，` +
      `裁剪 ${crop.x},${crop.y},${crop.w},${crop.h}）。`,
  );
}
for (const box of options.excludes) {
  if (box.x < 0 || box.y < 0 || box.x + box.w > image.width || box.y + box.h > image.height) {
    throw new Error('[gpu-device-api] analyze-screenshot: --exclude 超出图像范围。');
  }
}

const total = crop.w * crop.h;
const mask = new Uint8Array(total);
const foregroundMask = new Uint8Array(total);
const histogram = new Map();
let background = 0;
let opaqueBackground = 0;
let transparent = 0;
let excluded = 0;
let minBrightness = 255;
let maxBrightness = 0;
for (let y = 0; y < crop.h; y += 1) {
  for (let x = 0; x < crop.w; x += 1) {
    const globalX = crop.x + x;
    const globalY = crop.y + y;
    let isExcluded = false;
    for (const box of options.excludes) {
      if (globalX >= box.x && globalX < box.x + box.w && globalY >= box.y && globalY < box.y + box.h) {
        isExcluded = true;
        break;
      }
    }
    const index = (globalY * image.width + globalX) * 4;
    if (isExcluded) {
      excluded += 1;
      continue;
    }
    const backgroundPixel = isBackground(image.data, index, options.bg, options.tolerance);
    if (backgroundPixel) {
      mask[y * crop.w + x] = 1;
      background += 1;
      if (image.data[index + 3] < 8) transparent += 1;
      else opaqueBackground += 1;
      continue;
    }
    const key = (image.data[index] << 16) | (image.data[index + 1] << 8) | image.data[index + 2];
    histogram.set(key, (histogram.get(key) ?? 0) + 1);
    foregroundMask[y * crop.w + x] = 1;
    const brightness = (image.data[index] + image.data[index + 1] + image.data[index + 2]) / 3;
    if (brightness < minBrightness) minBrightness = brightness;
    if (brightness > maxBrightness) maxBrightness = brightness;
  }
}
const counted = total - excluded;
const components = connectedComponents(mask, crop.w, crop.h);
const foregroundComponents = options.foreground ? connectedComponents(foregroundMask, crop.w, crop.h) : [];
const topColors = [...histogram.entries()].sort((left, right) => right[1] - left[1]).slice(0, 5);

const report = {
  file: options.file,
  image: { width: image.width, height: image.height },
  crop,
  excludes: options.excludes,
  background: options.bg,
  tolerance: options.tolerance,
  countedPixels: counted,
  excludedPixels: excluded,
  backgroundPixels: background,
  backgroundRatio: counted === 0 ? 0 : background / counted,
  transparentPixels: transparent,
  opaqueBackgroundPixels: opaqueBackground,
  foregroundPixels: counted - background,
  foregroundRatio: counted === 0 ? 0 : (counted - background) / counted,
  componentCount: components.length,
  largestComponent: components[0]?.size ?? 0,
  largestComponentRatio: counted === 0 ? 0 : (components[0]?.size ?? 0) / counted,
  components: components.slice(0, options.top).map((entry) => ({
    pixels: entry.size,
    box: [entry.minX, entry.minY, entry.maxX - entry.minX + 1, entry.maxY - entry.minY + 1],
    touchesEdge:
      entry.minX === 0 || entry.minY === 0 || entry.maxX === crop.w - 1 || entry.maxY === crop.h - 1,
  })),
  distinctForegroundColors: histogram.size,
  topForegroundColors: topColors.map(([key, count]) => [
    (key >> 16) & 0xff,
    (key >> 8) & 0xff,
    key & 0xff,
    count,
  ]),
  foregroundBrightnessRange: [minBrightness === 255 ? null : minBrightness, maxBrightness],
  foregroundComponentCount: foregroundComponents.length,
  largestForegroundComponent: foregroundComponents[0]?.size ?? 0,
  foregroundComponents: foregroundComponents.slice(0, options.top).map((entry) => ({
    pixels: entry.size,
    box: [entry.minX, entry.minY, entry.maxX - entry.minX + 1, entry.maxY - entry.minY + 1],
  })),
};

const percent = (ratio) => `${(ratio * 100).toFixed(2)}%`;
console.log(`[analyze-screenshot] ${options.file}`);
console.log(`  图像 ${image.width}x${image.height}　裁剪 ${crop.x},${crop.y},${crop.w},${crop.h}　计入 ${counted} 像素（排除 ${excluded}）`);
console.log(
  `  背景色 ${options.bg.join(',')}（容差 ±${options.tolerance}）：${background} 像素 = ${percent(report.backgroundRatio)}` +
    `（其中完全透明 ${transparent}）`,
);
console.log(`  前景像素：${report.foregroundPixels} = ${percent(report.foregroundRatio)}`);
console.log(`  前景不同颜色数：${report.distinctForegroundColors}`);
console.log(
  `  背景连通域：${components.length} 个，最大 ${report.largestComponent} 像素 = ${percent(report.largestComponentRatio)}`,
);
for (const entry of report.components) {
  console.log(
    `    · ${entry.pixels} 像素　包围盒 x=${entry.box[0]} y=${entry.box[1]} w=${entry.box[2]} h=${entry.box[3]}` +
      `${entry.touchesEdge ? '（贴边）' : ''}`,
  );
}
console.log(`  前景里最常见的颜色（RGB 计数）：${report.topForegroundColors.map((entry) => entry.join(',')).join('　')}`);
if (options.foreground) {
  const largestBox = report.foregroundComponents[0]?.box;
  console.log(
    `  前景连通域：${report.foregroundComponentCount} 个，最大 ${report.largestForegroundComponent} 像素` +
      (largestBox ? `（包围盒 x=${largestBox[0]} y=${largestBox[1]} w=${largestBox[2]} h=${largestBox[3]}）` : ''),
  );
}
if (options.wantJson) {
  const text = JSON.stringify(report, null, 2);
  if (options.json) {
    writeFileSync(options.json, text, 'utf8');
    console.log(`  JSON 写入 ${options.json}`);
  } else {
    console.log(text);
  }
}
