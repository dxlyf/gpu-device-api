/**
 * core 层示例：**纹理 mip 路径对比** —— 旧的「JS 盒式降采样 + 逐级上传」对上新的「后端生成」。
 *
 * 这一页不是用来「演示好看」的，而是用来**取证**的：
 *
 * 1. 用同一份基础像素，分别建两张纹理：
 *    - **old**：`buildMipChain()` 在 JS 里逐级做 2×2 盒式平均，然后逐级 `writeTexture`；
 *    - **new**：只上传第 0 级，再调 `texture.generateMipmaps()`（WebGL2 是 `gl.generateMipmap`，
 *      WebGPU 是后端用 render pass 逐级降采样）。
 * 2. 用 `copyTextureToBuffer` 把**每一级 mip 的真实存储字节**读回主机（不是 canvas 截屏，
 *    也不经过任何采样/过滤），逐级比较两条路径。
 * 3. 同时在 JS 里算一条**面积加权的参考链**（sRGB 数据先解码到线性空间再加权），
 *    用来判定「谁更接近正确」。旧路径对 sRGB 数据是直接在编码字节上求平均，必然偏暗。
 * 4. 画布上把 mip 2 放大铺出来（上排 = 新路径，下排 = 旧路径），供真实合成截图比对。
 * 5. `?bench=1`（默认开）额外测 2048×2048 下两条路径的上传 + mip 生成耗时。
 *
 * 查询参数：`?backend=webgl2|webgpu|auto&bench=0&spin=0&verify=1`
 */

import {
  BindingType,
  BufferUsage,
  ShaderStage,
  TextureUsage,
  buildMipChain,
  fullMipLevelCount,
} from '../src/index.js';
import {
  backendFromQuery,
  buildQuadMesh,
  createCoreExample,
  reportVerify,
  requireElement,
  setData,
  startFrameLoop,
  verifyOffscreen,
} from './core-shared.js';
import { mipLevelExtent } from '../src/core/resources/Texture.js';
import type { Device } from '../src/core/Device.js';
import type { Texture } from '../src/core/resources/Texture.js';
import type { RenderPassEncoder } from '../src/core/render/RenderPassEncoder.js';

const CLEAR: readonly [number, number, number, number] = [0.043, 0.055, 0.075, 1];
/** uniform 块：vec4 rect + vec4 uvRect + float lod + float srgbEncode，std140 下补齐到 48 字节。 */
const UNIFORM_BYTES = 48;
/** 2048×2048 耗时测量的重复次数（含一次预热）。 */
const BENCH_ITERATIONS = 3;
const BENCH_SIZE = 2048;

/* ------------------------------------------------------------------------------------------------ */
/* 着色器：一个四边形，按 uniform 指定的 NDC 矩形 + uv 矩形 + 显式 lod 采样                          */
/* ------------------------------------------------------------------------------------------------ */

const VERTEX_GLSL = `
layout(location = 0) in vec3 position;
layout(location = 1) in vec2 uv;

layout(std140) uniform Uniforms {
  vec4 rect;
  vec4 uvRect;
  float lod;
  float srgbEncode;
} u;

out vec2 vUv;

void main() {
  vec2 t = position.xy * 0.5 + 0.5;
  gl_Position = vec4(mix(u.rect.xy, u.rect.zw, t), 0.0, 1.0);
  vUv = mix(u.uvRect.xy, u.uvRect.zw, uv);
}
`;

const FRAGMENT_GLSL = `
uniform sampler2D albedo;

// uniform 块必须在**每个用到它的阶段**各声明一次（GLSL 的接口块不跨阶段可见）。
layout(std140) uniform Uniforms {
  vec4 rect;
  vec4 uvRect;
  float lod;
  float srgbEncode;
} u;

in vec2 vUv;

layout(location = 0) out vec4 fragColor;

void main() {
  vec4 texel = textureLod(albedo, vUv, u.lod);
  if (u.srgbEncode > 0.5) {
    // srgb 纹理采样得到的是**线性**值；这里手动编码回 sRGB，屏幕上看到的就是纹理里
    // 真正存的字节，方便和读回的数值直接对照。
    vec3 linear = clamp(texel.rgb, 0.0, 1.0);
    vec3 low = linear * 12.92;
    vec3 high = 1.055 * pow(linear, vec3(1.0 / 2.4)) - 0.055;
    texel = vec4(mix(low, high, step(vec3(0.0031308), linear)), texel.a);
  }
  fragColor = texel;
}
`;

const MODULE_WGSL = `
struct Uniforms {
  rect: vec4f,
  uvRect: vec4f,
  lod: f32,
  srgbEncode: f32,
}

@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var albedo: texture_2d<f32>;
@group(0) @binding(2) var albedo_sampler: sampler;

struct VertexInput {
  @location(0) position: vec3f,
  @location(1) uv: vec2f,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
}

@vertex fn vsMain(v: VertexInput) -> VertexOutput {
  let t = v.position.xy * 0.5 + vec2f(0.5);
  var out: VertexOutput;
  out.position = vec4f(mix(u.rect.xy, u.rect.zw, t), 0.0, 1.0);
  out.uv = mix(u.uvRect.xy, u.uvRect.zw, v.uv);
  return out;
}

@fragment fn fsMain(in: VertexOutput) -> @location(0) vec4f {
  var texel = textureSampleLevel(albedo, albedo_sampler, in.uv, u.lod);
  if (u.srgbEncode > 0.5) {
    let linear = clamp(texel.rgb, vec3f(0.0), vec3f(1.0));
    let low = linear * 12.92;
    let high = 1.055 * pow(linear, vec3f(1.0 / 2.4)) - vec3f(0.055);
    texel = vec4f(select(low, high, linear >= vec3f(0.0031308)), texel.a);
  }
  return texel;
}
`;

/* ------------------------------------------------------------------------------------------------ */
/* 三个用例的基础内容                                                                                  */
/* ------------------------------------------------------------------------------------------------ */

interface TestCase {
  readonly key: string;
  readonly width: number;
  readonly height: number;
  readonly format: 'rgba8unorm' | 'rgba8unorm-srgb';
  readonly pixels: Uint8Array;
  /** srgb 纹理在画布上显示时需要手动编码回 sRGB，才能看到「存的字节」。 */
  readonly srgbEncode: boolean;
  /**
   * 画布上展示的 mip 级别：挑那一级**两条路径差异最明显**的，截图才有信息量。
   * （unorm64 在 2x2 时只差 1，srgb64 在 4x4 时差 61，npot 在 7x4 时差 35。）
   */
  readonly displayMip: number;
}

function createChecker(
  width: number,
  height: number,
  cell: number,
  first: readonly [number, number, number],
  second: readonly [number, number, number],
): Uint8Array {
  const pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const light = (Math.floor(x / cell) + Math.floor(y / cell)) % 2 === 0;
      const color = light ? first : second;
      const index = (y * width + x) * 4;
      pixels[index] = color[0];
      pixels[index + 1] = color[1];
      pixels[index + 2] = color[2];
      pixels[index + 3] = 255;
    }
  }
  return pixels;
}

/** 非 2 的幂 / 非正方形：左半边是 1 纹素的黑白棋盘（每一级都会被平均掉），右半边是彩条。 */
function createNpotPattern(width: number, height: number): Uint8Array {
  const pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      if (x < width / 2) {
        const on = (x + y) % 2 === 0;
        const value = on ? 255 : 0;
        pixels[index] = value;
        pixels[index + 1] = value;
        pixels[index + 2] = value;
      } else {
        const t = (x - width / 2) / (width / 2);
        pixels[index] = Math.round(255 * t);
        pixels[index + 1] = Math.round(255 * (1 - t));
        pixels[index + 2] = Math.round(128 + 127 * Math.sin(t * Math.PI));
      }
      pixels[index + 3] = 255;
    }
  }
  return pixels;
}

function createCases(): readonly TestCase[] {
  return [
    {
      key: 'unorm64',
      width: 64,
      height: 64,
      format: 'rgba8unorm',
      pixels: createChecker(64, 64, 16, [235, 168, 72], [40, 96, 190]),
      srgbEncode: false,
      // 2x2：旧路径逐通道截断（137）与新路径四舍五入（138）只差 1 —— 说明两条路径本质一致。
      displayMip: 5,
    },
    {
      key: 'srgb64',
      width: 64,
      height: 64,
      format: 'rgba8unorm-srgb',
      pixels: createChecker(64, 64, 8, [0, 0, 0], [255, 255, 255]),
      srgbEncode: true,
      // 4x4：旧 127（编码字节平均）vs 新 188（线性空间平均）—— 差 61，肉眼一眼可见。
      displayMip: 4,
    },
    {
      key: 'npot60x36',
      width: 60,
      height: 36,
      format: 'rgba8unorm',
      pixels: createNpotPattern(60, 36),
      srgbEncode: false,
      // 7x4：奇数尺寸降采样，旧路径整列/整行不参与平均，差 35。
      displayMip: 3,
    },
  ];
}

/* ------------------------------------------------------------------------------------------------ */
/* 参考链：面积加权盒式滤波（sRGB 先解码到线性空间再加权平均）                                          */
/* ------------------------------------------------------------------------------------------------ */

function srgbToLinear(value: number): number {
  return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
}

function linearToSrgb(value: number): number {
  return value <= 0.0031308 ? value * 12.92 : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
}

/**
 * 逐级降采样，每一级的目标纹素覆盖源纹素的一个矩形区域，按**面积重叠**加权求平均。
 * 偶数倍（2:1）时这就是标准的 2×2 盒式滤波；奇数倍时它是「不丢数据」的正确做法。
 */
function referenceMipChain(pixels: Uint8Array, width: number, height: number, linear: boolean): Uint8Array[] {
  const chain: Uint8Array[] = [pixels];
  let source = pixels;
  let sourceWidth = width;
  let sourceHeight = height;
  const levels = fullMipLevelCount({ width, height });
  for (let level = 1; level < levels; level++) {
    const target = mipLevelExtent({ width, height }, level);
    const out = new Uint8Array(target.width * target.height * 4);
    for (let y = 0; y < target.height; y++) {
      const y0 = (y * sourceHeight) / target.height;
      const y1 = ((y + 1) * sourceHeight) / target.height;
      for (let x = 0; x < target.width; x++) {
        const x0 = (x * sourceWidth) / target.width;
        const x1 = ((x + 1) * sourceWidth) / target.width;
        let r = 0;
        let g = 0;
        let b = 0;
        let a = 0;
        let weight = 0;
        for (let sy = Math.floor(y0); sy < Math.ceil(y1); sy++) {
          const wy = Math.min(sy + 1, y1) - Math.max(sy, y0);
          if (wy <= 0) continue;
          for (let sx = Math.floor(x0); sx < Math.ceil(x1); sx++) {
            const wx = Math.min(sx + 1, x1) - Math.max(sx, x0);
            if (wx <= 0) continue;
            const w = wx * wy;
            const index = (sy * sourceWidth + sx) * 4;
            if (linear) {
              r += srgbToLinear(source[index]! / 255) * w;
              g += srgbToLinear(source[index + 1]! / 255) * w;
              b += srgbToLinear(source[index + 2]! / 255) * w;
              a += (source[index + 3]! / 255) * w;
            } else {
              r += source[index]! * w;
              g += source[index + 1]! * w;
              b += source[index + 2]! * w;
              a += source[index + 3]! * w;
            }
            weight += w;
          }
        }
        const index = (y * target.width + x) * 4;
        const scale = weight === 0 ? 0 : 1 / weight;
        if (linear) {
          out[index] = Math.round(clamp01(linearToSrgb(r * scale)) * 255);
          out[index + 1] = Math.round(clamp01(linearToSrgb(g * scale)) * 255);
          out[index + 2] = Math.round(clamp01(linearToSrgb(b * scale)) * 255);
          out[index + 3] = Math.round(clamp01(a * scale) * 255);
        } else {
          out[index] = Math.round(r * scale);
          out[index + 1] = Math.round(g * scale);
          out[index + 2] = Math.round(b * scale);
          out[index + 3] = Math.round(a * scale);
        }
      }
    }
    chain.push(out);
    source = out;
    sourceWidth = target.width;
    sourceHeight = target.height;
  }
  return chain;
}

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

/* ------------------------------------------------------------------------------------------------ */
/* 纹理创建（两条路径）                                                                                */
/* ------------------------------------------------------------------------------------------------ */

interface ComparedTextures {
  readonly oldTexture: Texture;
  readonly newTexture: Texture;
  readonly levels: number;
}

function textureUsage(): TextureUsage {
  return (
    TextureUsage.TextureBinding |
    TextureUsage.CopyDst |
    TextureUsage.CopySrc |
    TextureUsage.RenderAttachment
  );
}

function generateMipmapsOrThrow(texture: Texture, context: string): void {
  if (typeof texture.generateMipmaps !== 'function') {
    throw new Error(`[gpu-device-api] ${context}: the backend does not implement Texture.generateMipmaps.`);
  }
  texture.generateMipmaps();
}

function createComparedTextures(device: Device, testCase: TestCase): ComparedTextures {
  const size = { width: testCase.width, height: testCase.height };
  const levels = fullMipLevelCount(size);
  const usage = textureUsage();

  // old：JS 盒式 mip 链，逐级上传（旧路径的全部代价都在这里）。
  const chain = buildMipChain(testCase.pixels, testCase.width, testCase.height);
  const oldTexture = device.createTexture({
    label: `mipmap:${testCase.key}:old`,
    size,
    format: testCase.format,
    mipLevelCount: levels,
    usage,
  });
  for (let level = 0; level < chain.length; level++) {
    const entry = chain[level]!;
    device.queue.writeTexture(
      { texture: oldTexture, mipLevel: level, origin: { x: 0, y: 0, z: 0 } },
      entry.data,
      { offset: 0, bytesPerRow: entry.width * 4, rowsPerImage: entry.height },
      { width: entry.width, height: entry.height, depthOrArrayLayers: 1 },
    );
  }

  // new：只上传第 0 级，其余级别由后端生成。
  const newTexture = device.createTexture({
    label: `mipmap:${testCase.key}:new`,
    size,
    format: testCase.format,
    mipLevelCount: levels,
    usage,
  });
  device.queue.writeTexture(
    { texture: newTexture, mipLevel: 0, origin: { x: 0, y: 0, z: 0 } },
    testCase.pixels,
    { offset: 0, bytesPerRow: testCase.width * 4, rowsPerImage: testCase.height },
    { width: testCase.width, height: testCase.height, depthOrArrayLayers: 1 },
  );
  generateMipmapsOrThrow(newTexture, `mipmap:${testCase.key}:new`);

  return { oldTexture, newTexture, levels };
}

/* ------------------------------------------------------------------------------------------------ */
/* 读回某一级 mip 的真实存储字节                                                                       */
/* ------------------------------------------------------------------------------------------------ */

/**
 * 读回时每行占多少字节。
 *
 * 这里必须按后端区分，原因是一个**已存在的后端差异**（本示例实测确认）：
 *
 * - WebGPU 要求 `copyTextureToBuffer` 的 `bytesPerRow` 是 **256 的倍数**，读回的数据按该行距排布；
 * - WebGL2 后端是用 `gl.readPixels` 读回的，而 `readPixels` 的输出**永远是紧凑排布**
 *   （只受 `PACK_ALIGNMENT` 影响，这里是 1），传入的 `bytesPerRow` 只被用来分配数组大小。
 *   所以 WebGL2 上必须传紧凑行距 `width * 4`，否则读回的数据整体错位（后面的行会读到 0）。
 */
function readbackPitch(width: number, backend: string): number {
  const tight = width * 4;
  return backend === 'webgl2' ? tight : Math.ceil(tight / 256) * 256;
}

async function readMipLevel(
  device: Device,
  texture: Texture,
  level: number,
  width: number,
  height: number,
  backend: string,
): Promise<Uint8Array> {
  const bytesPerRow = readbackPitch(width, backend);
  const byteLength = bytesPerRow * height;
  const buffer = device.createBuffer({
    label: `mipmap:read:${texture.label}:${level}`,
    size: byteLength,
    usage: BufferUsage.MapRead | BufferUsage.CopyDst,
  });
  const encoder = device.createCommandEncoder({ label: `mipmap:read:${level}` });
  encoder.copyTextureToBuffer(
    { texture, mipLevel: level, origin: { x: 0, y: 0, z: 0 } },
    { buffer, offset: 0, bytesPerRow },
    { width, height, depthOrArrayLayers: 1 },
  );
  device.queue.submit([encoder.finish()]);

  await buffer.mapAsync('read', 0, byteLength);
  const raw = new Uint8Array(buffer.getMappedRange(0, byteLength)).slice();
  buffer.unmap();
  buffer.destroy();

  const pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    pixels.set(raw.subarray(y * bytesPerRow, y * bytesPerRow + width * 4), y * width * 4);
  }
  return pixels;
}

/* ------------------------------------------------------------------------------------------------ */
/* 数值比较                                                                                            */
/* ------------------------------------------------------------------------------------------------ */

interface LevelComparison {
  readonly level: number;
  readonly size: string;
  /** (0,0) 处的像素。 */
  readonly oldCorner: string;
  readonly newCorner: string;
  /** 中心处的像素。 */
  readonly oldCenter: string;
  readonly newCenter: string;
  /** 两条路径差异最大的那个纹素。 */
  readonly oldWorst: string;
  readonly newWorst: string;
  readonly worstAt: string;
  readonly maxDiff: number;
  readonly diffTexels: number;
  /** 与「面积加权参考链」的最大逐通道偏差。 */
  readonly oldVsReference: number;
  readonly newVsReference: number;
  readonly reference: string;
}

function channel(values: Uint8Array, index: number): string {
  return `${values[index * 4]},${values[index * 4 + 1]},${values[index * 4 + 2]},${values[index * 4 + 3]}`;
}

function maxChannelDiff(a: Uint8Array, b: Uint8Array): number {
  let max = 0;
  for (let index = 0; index < a.length; index++) {
    const diff = Math.abs(a[index]! - b[index]!);
    if (diff > max) max = diff;
  }
  return max;
}

function compareLevel(
  level: number,
  width: number,
  height: number,
  oldPixels: Uint8Array,
  newPixels: Uint8Array,
  reference: Uint8Array,
): LevelComparison {
  const centerIndex = (Math.floor(height / 2) * width + Math.floor(width / 2)) * 4;
  let maxDiff = 0;
  let diffTexels = 0;
  let worst = 0;
  for (let texel = 0; texel < width * height; texel++) {
    let differs = false;
    for (let channelIndex = 0; channelIndex < 4; channelIndex++) {
      const diff = Math.abs(oldPixels[texel * 4 + channelIndex]! - newPixels[texel * 4 + channelIndex]!);
      if (diff > 0) differs = true;
      if (diff > maxDiff) {
        maxDiff = diff;
        worst = texel;
      }
    }
    if (differs) diffTexels += 1;
  }
  return {
    level,
    size: `${width}x${height}`,
    oldCorner: channel(oldPixels, 0),
    newCorner: channel(newPixels, 0),
    oldCenter: `${oldPixels[centerIndex]},${oldPixels[centerIndex + 1]},${oldPixels[centerIndex + 2]},${oldPixels[centerIndex + 3]}`,
    newCenter: `${newPixels[centerIndex]},${newPixels[centerIndex + 1]},${newPixels[centerIndex + 2]},${newPixels[centerIndex + 3]}`,
    oldWorst: channel(oldPixels, worst),
    newWorst: channel(newPixels, worst),
    worstAt: `${worst % width},${Math.floor(worst / width)}`,
    maxDiff,
    diffTexels,
    oldVsReference: maxChannelDiff(oldPixels, reference),
    newVsReference: maxChannelDiff(newPixels, reference),
    reference: channel(reference, worst),
  };
}

/* ------------------------------------------------------------------------------------------------ */
/* 2048×2048 的耗时测量                                                                                */
/* ------------------------------------------------------------------------------------------------ */

interface Timing {
  readonly size: string;
  readonly iterations: number;
  readonly oldJsMipMs: number;
  readonly oldUploadMs: number;
  readonly oldTotalMs: number;
  readonly newTotalMs: number;
}

function createBenchPixels(size: number): Uint8Array {
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const index = (y * size + x) * 4;
      pixels[index] = (x * 7) & 0xff;
      pixels[index + 1] = (y * 13) & 0xff;
      pixels[index + 2] = (x ^ y) & 0xff;
      pixels[index + 3] = 255;
    }
  }
  return pixels;
}

async function measureTiming(device: Device, iterations: number): Promise<Timing> {
  const size = BENCH_SIZE;
  const pixels = createBenchPixels(size);
  const levels = fullMipLevelCount({ width: size, height: size });
  const jsSamples: number[] = [];
  const oldSamples: number[] = [];
  const newSamples: number[] = [];

  const now = (): number => performance.now();

  for (let iteration = 0; iteration <= iterations; iteration++) {
    // 第 0 轮是预热：WebGPU 上第一次 generateMipmaps 要编译降采样管线，不能算进去。
    const warmup = iteration === 0;

    let started = now();
    const chain = buildMipChain(pixels, size, size);
    const jsMs = now() - started;

    const oldTexture = device.createTexture({
      label: 'bench:old',
      size: { width: size, height: size },
      format: 'rgba8unorm',
      mipLevelCount: levels,
      usage: TextureUsage.TextureBinding | TextureUsage.CopyDst,
    });
    started = now();
    for (let level = 0; level < chain.length; level++) {
      const entry = chain[level]!;
      device.queue.writeTexture(
        { texture: oldTexture, mipLevel: level, origin: { x: 0, y: 0, z: 0 } },
        entry.data,
        { offset: 0, bytesPerRow: entry.width * 4, rowsPerImage: entry.height },
        { width: entry.width, height: entry.height, depthOrArrayLayers: 1 },
      );
    }
    await device.queue.onSubmittedWorkDone();
    const oldUploadMs = now() - started;
    oldTexture.destroy();

    const newTexture = device.createTexture({
      label: 'bench:new',
      size: { width: size, height: size },
      format: 'rgba8unorm',
      mipLevelCount: levels,
      usage: textureUsage(),
    });
    started = now();
    device.queue.writeTexture(
      { texture: newTexture, mipLevel: 0, origin: { x: 0, y: 0, z: 0 } },
      pixels,
      { offset: 0, bytesPerRow: size * 4, rowsPerImage: size },
      { width: size, height: size, depthOrArrayLayers: 1 },
    );
    generateMipmapsOrThrow(newTexture, 'bench:new');
    await device.queue.onSubmittedWorkDone();
    const newTotalMs = now() - started;
    newTexture.destroy();

    if (!warmup) {
      jsSamples.push(jsMs);
      oldSamples.push(jsMs + oldUploadMs);
      newSamples.push(newTotalMs);
    }
  }

  const median = (values: number[]): number => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]!;
  return {
    size: `${size}x${size}`,
    iterations,
    oldJsMipMs: median(jsSamples),
    oldUploadMs: median(oldSamples) - median(jsSamples),
    oldTotalMs: median(oldSamples),
    newTotalMs: median(newSamples),
  };
}

/* ------------------------------------------------------------------------------------------------ */

async function main(): Promise<void> {
  const canvas = requireElement<HTMLCanvasElement>('view');
  const statusEl = requireElement<HTMLSpanElement>('status');
  const statsEl = requireElement<HTMLSpanElement>('stats');
  const outEl = requireElement<HTMLPreElement>('out');
  const query = new URLSearchParams(location.search);

  const example = await createCoreExample(canvas, backendFromQuery(query), 'core-texture-mipmap');
  const { device, context } = example;

  /* ---- 纹理对比 --------------------------------------------------------------------------- */
  const cases = createCases();
  const compared = cases.map((testCase) => createComparedTextures(device, testCase));

  const report: {
    backend: string;
    adapter: string;
    cases: {
      key: string;
      format: string;
      levels: number;
      levelSizes: string;
      referenceMatchesMipLevelExtent: boolean;
      comparisons: LevelComparison[];
    }[];
    timing: Timing | null;
  } = { backend: example.backend, adapter: example.adapter, cases: [], timing: null };

  const lines: string[] = [];
  lines.push(`=== 纹理 mip 路径对比（backend=${example.backend}, adapter=${example.adapter}） ===`);

  for (let caseIndex = 0; caseIndex < cases.length; caseIndex++) {
    const testCase = cases[caseIndex]!;
    const pair = compared[caseIndex]!;
    const linear = testCase.format === 'rgba8unorm-srgb';
    const reference = referenceMipChain(testCase.pixels, testCase.width, testCase.height, linear);
    const oldChain = buildMipChain(testCase.pixels, testCase.width, testCase.height);
    // 交叉检查：JS 链的每一级尺寸必须与 core 的 mipLevelExtent 完全一致，否则上传越界。
    const sizesMatch = oldChain.every((entry, level) => {
      const extent = mipLevelExtent({ width: testCase.width, height: testCase.height }, level);
      return entry.width === extent.width && entry.height === extent.height;
    });

    const comparisons: LevelComparison[] = [];
    for (let level = 0; level < pair.levels; level++) {
      const extent = mipLevelExtent({ width: testCase.width, height: testCase.height }, level);
      const oldPixels = await readMipLevel(device, pair.oldTexture, level, extent.width, extent.height, example.backend);
      const newPixels = await readMipLevel(device, pair.newTexture, level, extent.width, extent.height, example.backend);
      const comparison = compareLevel(
        level,
        extent.width,
        extent.height,
        oldPixels,
        newPixels,
        reference[level]!,
      );
      comparisons.push(comparison);

      const notable = level <= 2 || comparison.maxDiff > 0;
      if (notable) {
        lines.push(
          `  ${testCase.key} mip${level} ${comparison.size}  ` +
            `old(0,0)=${comparison.oldCorner} new(0,0)=${comparison.newCorner}  ` +
            `old(中心)=${comparison.oldCenter} new(中心)=${comparison.newCenter}`,
        );
        lines.push(
            `      最大逐通道差 ${comparison.maxDiff}（在 ${comparison.worstAt}：old=${comparison.oldWorst} ` +
            `new=${comparison.newWorst} 参考=${comparison.reference}），有差异的纹素 ${comparison.diffTexels}；` +
            `与参考链的最大偏差 old=${comparison.oldVsReference} new=${comparison.newVsReference}`,
        );
      }
    }

    report.cases.push({
      key: testCase.key,
      format: testCase.format,
      levels: pair.levels,
      levelSizes: oldChain.map((entry) => `${entry.width}x${entry.height}`).join(','),
      referenceMatchesMipLevelExtent: sizesMatch,
      comparisons,
    });
  }

  /* ---- 耗时 ------------------------------------------------------------------------------- */
  if (query.get('bench') !== '0') {
    const timing = await measureTiming(device, BENCH_ITERATIONS);
    report.timing = timing;
    lines.push('');
    lines.push(
      `=== ${timing.size} 上传 + mip 生成耗时（${timing.iterations} 次取中位数）===`,
    );
    lines.push(
      `  old：JS 盒式 mip ${timing.oldJsMipMs.toFixed(1)}ms + 逐级上传 ${timing.oldUploadMs.toFixed(1)}ms ` +
        `= ${timing.oldTotalMs.toFixed(1)}ms`,
    );
    lines.push(
      `  new：上传第 0 级 + 后端生成 = ${timing.newTotalMs.toFixed(1)}ms` +
        `（${(timing.oldTotalMs / timing.newTotalMs).toFixed(2)}x 加速）`,
    );
  }

  /* ---- 画布渲染：上排 = 新路径，下排 = 旧路径，都是 mip 2 -------------------------------------- */
  const mesh = buildQuadMesh(2);
  const positionBuffer = device.createBuffer({
    label: 'mipmap:positions',
    size: mesh.positions.byteLength,
    usage: BufferUsage.Vertex | BufferUsage.CopyDst,
  });
  device.queue.writeBuffer(positionBuffer, 0, mesh.positions);
  const uvBuffer = device.createBuffer({
    label: 'mipmap:uvs',
    size: mesh.uvs.byteLength,
    usage: BufferUsage.Vertex | BufferUsage.CopyDst,
  });
  device.queue.writeBuffer(uvBuffer, 0, mesh.uvs);
  const indexBuffer = device.createBuffer({
    label: 'mipmap:indices',
    size: mesh.indices.byteLength,
    usage: BufferUsage.Index | BufferUsage.CopyDst,
  });
  device.queue.writeBuffer(indexBuffer, 0, mesh.indices);

  // 采样器：级内用 nearest（放大后能看清每个纹素方块），级间用 nearest 或 linear 都行 ——
  // 这里必须给 `mipmapFilter: 'linear'`，因为 WebGL2 后端把 `minFilter: 'nearest'` +
  // `mipmapFilter: 'nearest'` 映射成了**不带 mip 的 NEAREST**（而不是 NEAREST_MIPMAP_NEAREST），
  // 于是 `textureLod(..., 4.0)` 会静默地只取第 0 级。这是后端的一处语义偏差，已单独反馈。
  // 用 `nearest` 级内 + `linear` 级间：显式 lod 是整数时不会真的做级间混合，取到的就是那一级。
  const sampler = device.createSampler({
    label: 'mipmap:nearest',
    magFilter: 'nearest',
    minFilter: 'nearest',
    mipmapFilter: 'linear',
    addressModeU: 'clamp-to-edge',
    addressModeV: 'clamp-to-edge',
  });

  const bindGroupLayout = device.createBindGroupLayout({
    label: 'mipmap:bindGroupLayout',
    entries: [
      {
        binding: 0,
        visibility: ShaderStage.Vertex | ShaderStage.Fragment,
        type: BindingType.Uniform,
        name: 'Uniforms',
        buffer: { type: 'uniform', minBindingSize: UNIFORM_BYTES },
      },
      {
        binding: 1,
        visibility: ShaderStage.Fragment,
        type: BindingType.Texture,
        name: 'albedo',
        texture: { sampleType: 'float', viewDimension: '2d' },
      },
      {
        binding: 2,
        visibility: ShaderStage.Fragment,
        type: BindingType.Sampler,
        name: 'albedo_sampler',
        sampler: { type: 'filtering' },
      },
    ],
  });
  const module = device.createShaderModule({
    label: 'mipmap:shader',
    code: { vs: VERTEX_GLSL, fs: FRAGMENT_GLSL, wgsl: MODULE_WGSL },
  });
  const pipelineLayout = device.createPipelineLayout({
    label: 'mipmap:pipelineLayout',
    bindGroupLayouts: [bindGroupLayout],
  });
  const pipeline = device.createRenderPipeline({
    label: 'mipmap:pipeline',
    layout: pipelineLayout,
    vertex: {
      module,
      entryPoint: 'vsMain',
      buffers: [
        {
          arrayStride: 12,
          stepMode: 'vertex',
          attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }],
        },
        {
          arrayStride: 8,
          stepMode: 'vertex',
          attributes: [{ shaderLocation: 1, offset: 0, format: 'float32x2' }],
        },
      ],
    },
    fragment: { module, entryPoint: 'fsMain' },
    primitive: { topology: 'triangle-list', cullMode: 'none' },
    depthStencil: { format: null },
  });

  interface Cell {
    readonly bindGroup: import('../src/core/binding/BindGroup.js').BindGroup;
  }
  const cells: Cell[] = [];
  // 上排（屏幕上半）= 新路径；下排 = 旧路径。
  const rows: readonly { path: 'new' | 'old'; top: number; bottom: number }[] = [
    { path: 'new', top: 0.03, bottom: 0.5 },
    { path: 'old', top: 0.51, bottom: 0.98 },
  ];
  for (const row of rows) {
    for (let column = 0; column < cases.length; column++) {
      const testCase = cases[column]!;
      const pair = compared[column]!;
      const x0 = column / cases.length + 0.01;
      const x1 = (column + 1) / cases.length - 0.01;
      // 屏幕坐标（y 向下）→ NDC。
      const uniforms = new Float32Array(UNIFORM_BYTES / 4);
      uniforms[0] = x0 * 2 - 1;
      uniforms[1] = 1 - row.bottom * 2;
      uniforms[2] = x1 * 2 - 1;
      uniforms[3] = 1 - row.top * 2;
      uniforms[4] = 0;
      uniforms[5] = 0;
      uniforms[6] = 1;
      uniforms[7] = 1;
      uniforms[8] = testCase.displayMip;
      uniforms[9] = testCase.srgbEncode ? 1 : 0;

      const buffer = device.createBuffer({
        label: `mipmap:uniform:${testCase.key}:${row.path}`,
        size: UNIFORM_BYTES,
        usage: BufferUsage.Uniform | BufferUsage.CopyDst,
      });
      device.queue.writeBuffer(buffer, 0, uniforms);
      const texture = row.path === 'new' ? pair.newTexture : pair.oldTexture;
      const bindGroup = device.createBindGroup({
        label: `mipmap:bindGroup:${testCase.key}:${row.path}`,
        layout: bindGroupLayout,
        entries: [
          { binding: 0, resource: { buffer, offset: 0, size: UNIFORM_BYTES } },
          { binding: 1, resource: { view: texture.createView() } },
          { binding: 2, resource: { sampler } },
        ],
      });
      cells.push({ bindGroup });
    }
  }

  const drawScene = (pass: RenderPassEncoder): void => {
    pass.setPipeline(pipeline);
    pass.setVertexBuffer(0, positionBuffer, 0, positionBuffer.size);
    pass.setVertexBuffer(1, uvBuffer, 0, uvBuffer.size);
    pass.setIndexBuffer(indexBuffer, 'uint16', 0, indexBuffer.size);
    for (const cell of cells) {
      pass.setBindGroup(0, cell.bindGroup);
      pass.drawIndexed({ indexCount: mesh.indices.length });
    }
  };

  const drawToCanvas = (): void => {
    context.resize();
    const frame = context.getCurrentFrameTarget();
    const encoder = device.createCommandEncoder({ label: 'mipmap:frame' });
    const pass = encoder.beginRenderPass({
      label: 'mipmap:pass',
      colorAttachments: [{ view: frame.view, loadOp: 'clear', storeOp: 'store', clearValue: CLEAR }],
    });
    drawScene(pass);
    pass.end();
    device.queue.submit([encoder.finish()]);
  };

  drawToCanvas();

  /* ---- 结论 ------------------------------------------------------------------------------- */
  outEl.textContent = lines.join('\n');
  setData('mipBackend', example.backend);
  setData('mipReport', JSON.stringify(report));
  const timing = report.timing;
  statusEl.textContent =
    `后端：${example.backend}　设备：${example.adapter}　` +
    `上排=后端生成 mip，下排=JS 盒式 mip（mip ${cases.map((testCase) => testCase.displayMip).join('/')}）` +
    (timing
      ? `　2048²：旧 ${timing.oldTotalMs.toFixed(0)}ms vs 新 ${timing.newTotalMs.toFixed(0)}ms`
      : '');
  setData('mipResult', 'ok');

  startFrameLoop({
    draw: () => {
      drawToCanvas();
    },
    onFps: (fps) => {
      statsEl.textContent = `${context.width}×${context.height}　${fps.toFixed(0)} FPS　6 draw calls`;
    },
  });

  if (query.get('verify') === '1') {
    const stats = await verifyOffscreen(device, 96, 96, CLEAR, drawScene);
    reportVerify('mipmap', stats, true);
  }
}

main().catch((error: unknown) => {
  setData('mipResult', 'fail');
  setData('mipError', (error as Error).message);
  const statusEl = document.getElementById('status');
  if (statusEl) {
    statusEl.textContent = `启动失败：${(error as Error).message}`;
    statusEl.className = 'error';
  }
  const outEl = document.getElementById('out');
  if (outEl) outEl.textContent = `${(error as Error).stack ?? (error as Error).message}`;
});
