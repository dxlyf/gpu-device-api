#!/usr/bin/env node
/**
 * 两张截图的**逐像素**比对工具：判定 B 相对 A 是「原样 / 上下翻转 / 左右镜像 / 旋转 180° /
 * 通道顺序颠倒（RGBA ↔ BGRA）」，并给出各自的一致率。
 *
 * 为什么需要它：判断「两个后端画得一样不一样」不能靠肉眼，也不能靠页内 `drawImage` /
 * `readPixels` —— 本仓库的示例都是 `preserveDrawingBuffer: false`，合成之后页内读回一律是黑的
 * （见 `scripts/analyze-screenshot.mjs` 的说明）。唯一可信的输入是真实合成截图
 * （`scripts/capture-screenshot.mjs`），而「到底哪里不一样」必须量化：
 * 列出一致率之后，**上下翻转一致率**是不是高得离谱，就是「行序/UV 原点反了」的决定性判据。
 *
 * 真实用例（`examples/core-texture.html?verify=1&spin=0`，画布都是 1000×600）：
 *
 *   webgl2 截图 vs webgpu 截图（修复后）：
 *     原样 100.00%（容差 ±8，其中 95.80% 逐字节相同，平均通道差 0.05）
 *     上下翻转 66.31%　左右镜像 64.37%　通道颠倒 65.03%
 *     → 两者画的是同一张图，差异只有驱动滤波的 1~4 个色阶。
 *
 *   修复前（`verifyOffscreen` 还在按 texel 行序读回时）那两个 `data-*-pixel` 是
 *   `51,100,184` 与 `220,162,81`，但截图口径始终是「原样 100% 一致」——
 *   也就是说**上屏结果本来就是一致的**，不一致的是读回的行序，这一点正是靠本工具定下来的。
 *
 * 用法：
 *   node scripts/compare-screenshots.mjs <a.png> <b.png> [选项]
 *
 * 选项：
 *   --crop x,y,w,h       只比较这块矩形（通常是页面报告的 canvas rect；默认整图）
 *   --tolerance n        逐通道容差（默认 8）。一致率同时给出「逐字节相同」与「容差内一致」两列
 *   --min-identity r     原样一致率低于 r（0~1，例如 0.99）时以退出码 1 结束，便于当断言用
 *   --json [文件]        额外输出 JSON（不写文件名时只打印到 stdout）
 *
 * 退出码：0 = 比较完成且满足 --min-identity；1 = 参数错误 / PNG 解码失败 / 未达阈值。
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

/* ------------------------------------------------------------------------------------------------ */
/* 参数解析                                                                                            */
/* ------------------------------------------------------------------------------------------------ */

function parseRect(text, name) {
  const parts = String(text)
    .split(',')
    .map((piece) => Number(piece.trim()));
  if (parts.length !== 4 || parts.some((value) => !Number.isFinite(value))) {
    throw new Error(`[gpu-device-api] compare-screenshots: ${name} 需要 x,y,w,h 四个数字，收到 "${text}"。`);
  }
  return { x: Math.trunc(parts[0]), y: Math.trunc(parts[1]), w: Math.trunc(parts[2]), h: Math.trunc(parts[3]) };
}

const argv = process.argv.slice(2);
if (argv.length < 2 || argv[0].startsWith('--')) {
  console.error(
    '[gpu-device-api] compare-screenshots: 用法 node scripts/compare-screenshots.mjs <a.png> <b.png> ' +
      '[--crop x,y,w,h] [--tolerance n] [--min-identity r] [--json [文件]]',
  );
  process.exit(1);
}

const options = { fileA: argv[0], fileB: argv[1], crop: null, tolerance: 8, minIdentity: null, wantJson: false, json: null };
for (let index = 2; index < argv.length; index += 1) {
  const arg = argv[index];
  if (arg === '--crop') options.crop = parseRect(argv[(index += 1)], '--crop');
  else if (arg === '--tolerance') options.tolerance = Number(argv[(index += 1)]);
  else if (arg === '--min-identity') options.minIdentity = Number(argv[(index += 1)]);
  else if (arg === '--json') {
    options.wantJson = true;
    const next = argv[index + 1];
    if (next !== undefined && !next.startsWith('--')) {
      options.json = next;
      index += 1;
    }
  } else {
    throw new Error(`[gpu-device-api] compare-screenshots: 未知参数 "${arg}"。`);
  }
}
if (!Number.isFinite(options.tolerance) || options.tolerance < 0) {
  throw new Error('[gpu-device-api] compare-screenshots: --tolerance 必须是非负数。');
}

/* ------------------------------------------------------------------------------------------------ */
/* 最小 PNG 解码器（只依赖 node:zlib，与 analyze-screenshot.mjs 同一套反过滤器）                          */
/* ------------------------------------------------------------------------------------------------ */

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
          const p = left + up - upLeft;
          const pa = Math.abs(p - left);
          const pb = Math.abs(p - up);
          const pc = Math.abs(p - upLeft);
          result = value + (pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft);
          break;
        }
        default:
          throw new Error(`[gpu-device-api] compare-screenshots: 未知的 PNG 过滤器 ${filter}。`);
      }
      out[lineStart + x] = result & 0xff;
    }
    position += stride;
  }
  return out;
}

function decodePng(buffer) {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let index = 0; index < signature.length; index += 1) {
    if (buffer[index] !== signature[index]) {
      throw new Error('[gpu-device-api] compare-screenshots: 不是 PNG 文件。');
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
    } else if (type === 'PLTE') palette = Buffer.from(body);
    else if (type === 'tRNS') transparency = Buffer.from(body);
    else if (type === 'IDAT') idat.push(body);
    else if (type === 'IEND') break;
  }
  if (interlace !== 0) throw new Error('[gpu-device-api] compare-screenshots: 暂不支持 Adam7 隔行扫描。');
  if (bitDepth !== 8) throw new Error(`[gpu-device-api] compare-screenshots: 只支持 8 位深，收到 ${bitDepth}。`);
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
  if (channels === undefined) {
    throw new Error(`[gpu-device-api] compare-screenshots: 不支持的 PNG 彩色类型 ${colorType}。`);
  }
  const raw = inflateSync(Buffer.concat(idat));
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
/* 比较                                                                                                */
/* ------------------------------------------------------------------------------------------------ */

const imageA = decodePng(readFileSync(options.fileA));
const imageB = decodePng(readFileSync(options.fileB));
if (imageA.width !== imageB.width || imageA.height !== imageB.height) {
  console.error(
    `[gpu-device-api] compare-screenshots: 两张图尺寸不同（${imageA.width}x${imageA.height} vs ` +
      `${imageB.width}x${imageB.height}），只有落在两张图内的区域会被比较。`,
  );
}
const crop = options.crop ?? { x: 0, y: 0, w: Math.min(imageA.width, imageB.width), h: Math.min(imageA.height, imageB.height) };
if (crop.w <= 0 || crop.h <= 0) {
  throw new Error('[gpu-device-api] compare-screenshots: --crop 的宽高必须为正。');
}

/** 取像素（越界返回 null）。 */
function pixelAt(image, x, y) {
  if (x < 0 || y < 0 || x >= image.width || y >= image.height) return null;
  const index = (y * image.width + x) * 4;
  return [image.data[index], image.data[index + 1], image.data[index + 2]];
}

/**
 * 按给定的坐标映射比较：`map(x, y)` 给出 B 上对应的坐标。
 * 同时统计「逐字节完全相同」与「逐通道差在容差内」两种口径，以及平均/最大通道差。
 */
function compare(label, map, swapChannels = false) {
  let exact = 0;
  let close = 0;
  let total = 0;
  let sum = 0;
  let maxDiff = 0;
  for (let y = 0; y < crop.h; y += 1) {
    for (let x = 0; x < crop.w; x += 1) {
      const a = pixelAt(imageA, crop.x + x, crop.y + y);
      if (!a) continue;
      const [bx, by] = map(crop.x + x, crop.y + y);
      let b = pixelAt(imageB, bx, by);
      if (!b) continue;
      if (swapChannels) b = [b[2], b[1], b[0]];
      const diffs = [Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2])];
      const worst = Math.max(...diffs);
      total += 1;
      sum += worst;
      if (worst > maxDiff) maxDiff = worst;
      if (worst === 0) exact += 1;
      if (worst <= options.tolerance) close += 1;
    }
  }
  const ratio = total === 0 ? 0 : close / total;
  return { label, exact, close, total, ratio, meanDiff: total === 0 ? 0 : sum / total, maxDiff };
}

const mirrorX = (x) => crop.x + crop.w - 1 - (x - crop.x);
const mirrorY = (y) => crop.y + crop.h - 1 - (y - crop.y);

const comparisons = [
  compare('B 原样', (x, y) => [x, y]),
  compare('B 上下翻转', (x, y) => [x, mirrorY(y)]),
  compare('B 左右镜像', (x, y) => [mirrorX(x), y]),
  compare('B 旋转 180°', (x, y) => [mirrorX(x), mirrorY(y)]),
  compare('B 原样 + 通道颠倒', (x, y) => [x, y], true),
  compare('B 上下翻转 + 通道颠倒', (x, y) => [x, mirrorY(y)], true),
];

const percent = (value) => `${(value * 100).toFixed(2)}%`;
console.log(`[compare-screenshots]`);
console.log(`  A = ${options.fileA}（${imageA.width}x${imageA.height}）`);
console.log(`  B = ${options.fileB}（${imageB.width}x${imageB.height}）`);
console.log(`  比较区域 ${crop.x},${crop.y},${crop.w},${crop.h}　容差 ±${options.tolerance}`);
for (const entry of comparisons) {
  console.log(
    `    ${entry.label.padEnd(20)} 逐字节相同 ${percent(entry.exact / entry.total).padStart(7)}　` +
      `容差内一致 ${percent(entry.ratio).padStart(7)}　平均通道差 ${entry.meanDiff.toFixed(2)}　最大 ${entry.maxDiff}`,
  );
}

const identity = comparisons[0];
const best = [...comparisons].sort((left, right) => right.close - left.close)[0];
const centerX = crop.x + Math.floor(crop.w / 2);
const centerY = crop.y + Math.floor(crop.h / 2);
console.log(
  `  最匹配：${best.label}（${percent(best.ratio)}，平均通道差 ${best.meanDiff.toFixed(2)}）` +
    (best.label === identity.label ? '' : '　← 不是「原样」，说明两张图之间存在整体几何/通道差异'),
);
console.log(
  `  中心像素 A=${pixelAt(imageA, centerX, centerY)?.join(',')}　B=${pixelAt(imageB, centerX, centerY)?.join(',')}` +
    `　B 上下翻转后在该位置=${pixelAt(imageB, centerX, mirrorY(centerY))?.join(',')}`,
);

if (options.wantJson) {
  const report = {
    fileA: options.fileA,
    fileB: options.fileB,
    crop,
    tolerance: options.tolerance,
    comparisons: comparisons.map((entry) => ({
      label: entry.label,
      exactRatio: entry.exact / entry.total,
      withinToleranceRatio: entry.ratio,
      meanChannelDiff: entry.meanDiff,
      maxChannelDiff: entry.maxDiff,
    })),
    bestMatch: best.label,
    identityRatio: identity.ratio,
  };
  const text = JSON.stringify(report, null, 2);
  if (options.json) {
    writeFileSync(options.json, text, 'utf8');
    console.log(`  JSON 写入 ${options.json}`);
  } else {
    console.log(text);
  }
}

if (options.minIdentity !== null) {
  if (!Number.isFinite(options.minIdentity)) {
    throw new Error('[gpu-device-api] compare-screenshots: --min-identity 必须是 0~1 的数字。');
  }
  if (identity.ratio < options.minIdentity) {
    console.error(
      `[gpu-device-api] compare-screenshots: 原样一致率 ${percent(identity.ratio)} 低于要求的 ` +
        `${percent(options.minIdentity)}。`,
    );
    process.exit(1);
  }
  console.log(`  原样一致率 ${percent(identity.ratio)} ≥ ${percent(options.minIdentity)}，达标。`);
}
