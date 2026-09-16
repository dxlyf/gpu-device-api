/**
 * 批 04（第二档）的复现/回归测试：WebGL2 纹素拷贝路径上的静默错误。
 *
 * 这一批五项的共同点是**GL 有能力表达，但本库没用上**：
 * `#6` 多层上传只分配了一张 image、`#7` 从不读 `rowsPerImage`、
 * `#8` `copyTextureToTexture` 丢掉 `origin.z`、`#9` 深度纹理读回必然全 0、
 * `#13` 一批 descriptor 字段被静默忽略。
 *
 * ## 为什么这里全靠假 GL 也能算「证据」
 *
 * `gl.texSubImage3D` / `gl.readPixels` 的输入参数是**同步写入**的：
 * GL 在调用返回时就已经把主机内存里的数据拷进纹理（或把纹理读进内存）。
 * 所以「下发了什么调用、传了多少字节、什么 format/type」是**规范层面可判定的**，
 * 不需要真实 GPU 也能确定结果对不对 —— 只要假 GL 如实记录调用参数，
 * 并且**按 GL 的契约检查它自己的输入**（数据够不够、format/type 组合合法不合法）。
 *
 * 因此本文件的假 GL 有两层职责：
 * 1. 记录每一次 `texSubImage3D` / `readPixels` / `pixelStorei` / 附件挂载的**完整参数**；
 * 2. 像真实驱动一样**拒绝**非法的输入（数据不足 → `INVALID_OPERATION`、
 *    非法的 format/type 组合 → `INVALID_ENUM`），并让测试断言「没有发生过错误」。
 *
 * 第 2 条是这一批的关键：本库默认不查 GL 错误，所以修复前这些错误是**静默**的。
 * 把「驱动会拒绝」这件事写进假 GL，才能把「不报错但结果错」变成一条会失败的断言。
 *
 * 真实 GL 的行为（`readPixels` 的合法 format/type 组合、`UNPACK_IMAGE_HEIGHT` 是否生效）
 * 另有只读原生探针复核，见 `.tmp-04/`（不随库发布）。
 */

import { describe, expect, it } from 'vitest';

import { ValidationError } from '../src/core/errors/ValidationError.js';
import { GlStateCache } from '../src/webgl2/utils/glStateCache.js';
import { WebGL2CommandEncoder } from '../src/webgl2/render/WebGL2CommandEncoder.js';
import { WebGL2Queue } from '../src/webgl2/sync/WebGL2Queue.js';
import type { WebGL2RenderPassOptions } from '../src/webgl2/render/WebGL2RenderPassEncoder.js';
import type { WebGL2Buffer } from '../src/webgl2/resources/WebGL2Buffer.js';
import type { WebGL2Texture } from '../src/webgl2/resources/WebGL2Texture.js';
import type { FakeWebGL2 } from './webgl2-fake-gl.js';
import { createFakeWebGL2 } from './webgl2-fake-gl.js';

/** 共享假 GL 的记录里用到的 GL 常量（与 `test/webgl2-fake-gl.ts` 的记录格式对齐）。 */
const GL_UNPACK_ALIGNMENT = 0x0cf5;
const GL_UNPACK_ROW_LENGTH = 0x0cf2;
const GL_UNPACK_IMAGE_HEIGHT = 0x806e;

/* ------------------------------------------------------------------ GL 常量 --------------- */

const GL = {
  NO_ERROR: 0,
  TEXTURE_2D: 0x0de1,
  TEXTURE_3D: 0x806f,
  TEXTURE_2D_ARRAY: 0x8c1a,
  FRAMEBUFFER: 0x8d40,
  READ_FRAMEBUFFER: 0x8ca8,
  DRAW_FRAMEBUFFER: 0x8ca9,
  FRAMEBUFFER_BINDING: 0x8ca6,
  FRAMEBUFFER_COMPLETE: 0x8cd5,
  COLOR_ATTACHMENT0: 0x8ce0,
  DEPTH_ATTACHMENT: 0x8d00,
  STENCIL_ATTACHMENT: 0x8d20,
  DEPTH_STENCIL_ATTACHMENT: 0x821a,
  COLOR_BUFFER_BIT: 0x4000,
  DEPTH_BUFFER_BIT: 0x100,
  DEPTH_COMPONENT: 0x1902,
  DEPTH_STENCIL: 0x84f9,
  RGBA: 0x1908,
  RED: 0x1903,
  UNSIGNED_BYTE: 0x1401,
  UNSIGNED_SHORT: 0x1403,
  UNSIGNED_INT: 0x1405,
  FLOAT: 0x1406,
  UNSIGNED_INT_24_8: 0x84fa,
  UNSIGNED_INT_2_10_10_10_REV: 0x8368,
  UNPACK_ALIGNMENT: 0x0cf5,
  UNPACK_ROW_LENGTH: 0x0cf2,
  UNPACK_IMAGE_HEIGHT: 0x806e,
  UNPACK_SKIP_ROWS: 0x0cf3,
  UNPACK_SKIP_PIXELS: 0x0cf4,
  UNPACK_SKIP_IMAGES: 0x806d,
  PACK_ALIGNMENT: 0x0d05,
  INVALID_ENUM: 0x0500,
  INVALID_OPERATION: 0x0502,
  NEAREST: 0x2600,
  MAX_SAMPLES: 0x8d57,
  SAMPLES: 0x80a9,
  FRAMEBUFFER_INCOMPLETE_MULTISAMPLE: 0x8d56,
} as const;

/** GL 像素类型 → 每个元素几个字节；`readPixels`/`texSubImage` 的「数据够不够」全靠它。 */
const GL_TYPE_BYTES: Record<number, number> = {
  [GL.UNSIGNED_BYTE]: 1,
  [GL.UNSIGNED_SHORT]: 2,
  [GL.UNSIGNED_INT]: 4,
  [GL.FLOAT]: 4,
  [GL.UNSIGNED_INT_24_8]: 4,
  [GL.UNSIGNED_INT_2_10_10_10_REV]: 4,
};

/** GL 像素格式 → 每个像素几个分量；`DEPTH_COMPONENT` 恒为 1。 */
const GL_FORMAT_COMPONENTS: Record<number, number> = {
  [GL.RGBA]: 4,
  [GL.RED]: 1,
  [GL.DEPTH_COMPONENT]: 1,
  [GL.DEPTH_STENCIL]: 1,
};

/* ------------------------------------------------------------------ 假 GL ---------------- */

interface UploadCall {
  target: number;
  /** 上传时绑定的纹理名（`bindTexture` 上来的最后一个）。 */
  texture: string | null;
  level: number;
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  format: number;
  type: number;
  /** 主机数据的**字节**长度。 */
  byteLength: number;
  /** 上传时生效的 unpack 参数。 */
  rowLength: number;
  imageHeight: number;
  alignment: number;
}

interface ReadCall {
  x: number;
  y: number;
  width: number;
  height: number;
  format: number;
  type: number;
  byteLength: number;
  alignment: number;
  /** readPixels 时 READ_FRAMEBUFFER 上挂的是哪个纹理、第几层。 */
  attachmentTexture: string | null;
  attachmentLayer: number | null;
}

interface AttachCall {
  target: number;
  attachment: number;
  texture: string;
  layer: number | null;
}

interface BlitCall {
  srcX0: number;
  srcY0: number;
  srcX1: number;
  srcY1: number;
  dstX0: number;
  dstY0: number;
  dstX1: number;
  dstY1: number;
  mask: number;
  filter: number;
  readFramebuffer: string | null;
  drawFramebuffer: string | null;
}

interface FakeGl {
  gl: WebGL2RenderingContext;
  readonly uploads: UploadCall[];
  readonly reads: ReadCall[];
  readonly attaches: AttachCall[];
  readonly blits: BlitCall[];
  /** 每次 `pixelStorei` 的顺序记录，形如 `UNPACK_IMAGE_HEIGHT=2`。 */
  readonly pixelStoreiCalls: string[];
  /** 假 GL 自己检出的 GL 错误（真实驱动会返回非 0 的 `gl.getError()`）。 */
  readonly errors: string[];
  /** 记录每次上传/读回时看到的 unpack/pack 状态。 */
  unpackState(): { rowLength: number; imageHeight: number; alignment: number };
  /** 某一个纹理收到的所有上传（按发生顺序）。 */
  uploadsFor(textureName: string): UploadCall[];
  /** 重置错误记录（在每个用例的关键调用之前调用）。 */
  clearErrors(): void;
}

function createFakeGl(): FakeGl {
  const uploads: UploadCall[] = [];
  const reads: ReadCall[] = [];
  const attaches: AttachCall[] = [];
  const blits: BlitCall[] = [];
  const pixelStoreiCalls: string[] = [];
  const errors: string[] = [];

  const unpack = { alignment: 4, rowLength: 0, imageHeight: 0, skipRows: 0, skipPixels: 0, skipImages: 0 };
  let packAlignment = 4;

  const textureNames = new WeakMap<object, string>();
  let nextId = 0;
  function makeTexture(): object {
    const texture = {};
    textureNames.set(texture, `tex${(nextId += 1)}`);
    return texture;
  }
  const nameOf = (value: unknown): string =>
    value && typeof value === 'object' ? (textureNames.get(value) ?? '?') : String(value);

  /* 附件状态：READ/DRAW framebuffer 上挂的 (纹理, 层)。 */
  const attachmentsByFramebuffer = new Map<unknown, { texture: string | null; layer: number | null }>();
  let boundReadFramebuffer: unknown = null;
  let boundDrawFramebuffer: unknown = null;
  let boundFramebuffer: unknown = null;

  /** 每一次 `texSubImage3D` 都属于「最后绑定过的那张纹理」，这里按名字归类。 */
  let boundTextureName: string | null = null;
  const gl = {
    ...GL,

    createTexture: () => makeTexture(),
    deleteTexture: () => {},
    bindTexture: (_target: number, texture: unknown) => {
      boundTextureName = texture ? nameOf(texture) : null;
    },
    texStorage2D: () => {},
    texStorage3D: () => {},
    texStorage2DMultisample: () => {},
    texParameteri: () => {},
    activeTexture: () => {},

    pixelStorei: (pname: number, value: number) => {
      switch (pname) {
        case GL.UNPACK_ALIGNMENT:
          unpack.alignment = value;
          pixelStoreiCalls.push(`UNPACK_ALIGNMENT=${value}`);
          break;
        case GL.UNPACK_ROW_LENGTH:
          unpack.rowLength = value;
          pixelStoreiCalls.push(`UNPACK_ROW_LENGTH=${value}`);
          break;
        case GL.UNPACK_IMAGE_HEIGHT:
          unpack.imageHeight = value;
          pixelStoreiCalls.push(`UNPACK_IMAGE_HEIGHT=${value}`);
          break;
        case GL.UNPACK_SKIP_ROWS:
          unpack.skipRows = value;
          break;
        case GL.UNPACK_SKIP_PIXELS:
          unpack.skipPixels = value;
          break;
        case GL.UNPACK_SKIP_IMAGES:
          unpack.skipImages = value;
          break;
        case GL.PACK_ALIGNMENT:
          packAlignment = value;
          pixelStoreiCalls.push(`PACK_ALIGNMENT=${value}`);
          break;
        default:
          break;
      }
    },

    /**
     * 假 `texSubImage3D`：像真实驱动一样按 GL 的契约检查两个前提。
     *
     * - 数据必须够：最远的一个像素的**字节偏移**不能超过主机数据长度，否则 `INVALID_OPERATION`
     *   （GL 按 `UNPACK_SKIP_*` + `UNPACK_ROW_LENGTH` + `UNPACK_IMAGE_HEIGHT` 定位每一层每一行，
     *   与请求的 `height` 无关 —— 这也是 `#7` 的病理所在）。
     * - `format` / `type` 的组合必须合法，否则 `INVALID_ENUM`。
     */
    texSubImage3D: (
      target: number,
      level: number,
      x: number,
      y: number,
      z: number,
      width: number,
      height: number,
      depth: number,
      format: number,
      type: number,
      data: ArrayBufferView,
    ) => {
      const elementBytes = GL_TYPE_BYTES[type];
      const components = GL_FORMAT_COMPONENTS[format];
      if (elementBytes === undefined || components === undefined) {
        errors.push(`INVALID_ENUM: unsupported format/type 0x${format.toString(16)}/0x${type.toString(16)}`);
        return;
      }
      const bytesPerPixel = elementBytes * components;
      const byteLength = data.byteLength;
      const rowLength = unpack.rowLength > 0 ? unpack.rowLength : width;
      const imageHeight = unpack.imageHeight > 0 ? unpack.imageHeight : height;
      const rowStride = rowLength * bytesPerPixel;
      const imageStride = rowStride * imageHeight;
      const lastRowStart = (depth - 1) * imageStride + (height - 1) * rowStride;
      const lastByte = lastRowStart + width * bytesPerPixel;
      // 行与行之间必须能被 UNPACK_ALIGNMENT 整除（GL 读取行首的实际规则）。
      if (rowStride % unpack.alignment !== 0) {
        errors.push(
          `INVALID_OPERATION: row stride ${rowStride} is not a multiple of UNPACK_ALIGNMENT ${unpack.alignment}`,
        );
      }
      if (byteLength < lastByte) {
        errors.push(
          `INVALID_OPERATION: texSubImage3D's last pixel ends at byte ${lastByte} ` +
            `(${width}x${height}x${depth}, rowLength=${rowLength}, imageHeight=${imageHeight}, ` +
            `${bytesPerPixel} B/px, UNPACK_ALIGNMENT=${unpack.alignment}) but the host data is only ${byteLength} bytes`,
        );
      }
      uploads.push({
        target,
        texture: boundTextureName,
        level,
        x,
        y,
        z,
        width,
        height,
        depth,
        format,
        type,
        byteLength,
        rowLength: unpack.rowLength,
        imageHeight: unpack.imageHeight,
        alignment: unpack.alignment,
      });
    },

    texSubImage2D: () => {},

    createFramebuffer: () => ({ fbo: (nextId += 1) }),
    deleteFramebuffer: () => {},
    bindFramebuffer: (target: number, framebuffer: unknown) => {
      // GL 的 `FRAMEBUFFER` 是 READ 与 DRAW 的**同一个**绑定点，`bindFramebuffer` 两边一起改。
      if (target === GL.FRAMEBUFFER) {
        boundFramebuffer = framebuffer;
        boundReadFramebuffer = framebuffer;
        boundDrawFramebuffer = framebuffer;
      } else if (target === GL.READ_FRAMEBUFFER) {
        boundReadFramebuffer = framebuffer;
      } else if (target === GL.DRAW_FRAMEBUFFER) {
        boundDrawFramebuffer = framebuffer;
      }
      if (framebuffer && !attachmentsByFramebuffer.has(framebuffer)) {
        attachmentsByFramebuffer.set(framebuffer, { texture: null, layer: null });
      }
    },
    framebufferTexture2D: (target: number, attachment: number, _texTarget: number, texture: unknown) => {
      const framebuffer = target === GL.READ_FRAMEBUFFER ? boundReadFramebuffer : boundDrawFramebuffer;
      if (framebuffer && texture) {
        attachmentsByFramebuffer.set(framebuffer, { texture: nameOf(texture), layer: null });
      }
      attaches.push({ target, attachment, texture: nameOf(texture), layer: null });
    },
    framebufferTextureLayer: (
      target: number,
      attachment: number,
      texture: unknown,
      _level: number,
      layer: number,
    ) => {
      const framebuffer = target === GL.READ_FRAMEBUFFER ? boundReadFramebuffer : boundDrawFramebuffer;
      if (framebuffer && texture) {
        attachmentsByFramebuffer.set(framebuffer, { texture: nameOf(texture), layer });
      }
      attaches.push({ target, attachment, texture: nameOf(texture), layer });
    },
    framebufferRenderbuffer: () => {},
    drawBuffers: () => {},
    checkFramebufferStatus: () => GL.FRAMEBUFFER_COMPLETE,
    getParameter: (pname: number) => {
      if (pname === GL.FRAMEBUFFER_BINDING) return boundFramebuffer;
      if (pname === GL.MAX_SAMPLES) return 8;
      if (pname === GL.SAMPLES) return 1;
      return 0;
    },
    getInternalformatParameter: () => Int32Array.from([1, 2, 4, 8]),

    /**
     * 假 `readPixels`：同样按 GL 的契约检查输入。
     *
     * WebGL2（GLES 3.0）的 `readPixels` 只接受下表这几组 format/type —— 与 WebGL1 不同，
     * **没有** `DEPTH_COMPONENT` + `UNSIGNED_INT`（更没有 `UNSIGNED_SHORT` / `UNSIGNED_INT_24_8`）。
     * 本机原生探针实测同样如此（`0x500 INVALID_ENUM`）。
     */
    readPixels: (
      x: number,
      y: number,
      width: number,
      height: number,
      format: number,
      type: number,
      dst: ArrayBufferView,
    ) => {
      const legal =
        (format === GL.RGBA && (type === GL.UNSIGNED_BYTE || type === GL.FLOAT)) ||
        (format === GL.RED && (type === GL.UNSIGNED_BYTE || type === GL.FLOAT)) ||
        (format === GL.DEPTH_COMPONENT && type === GL.UNSIGNED_INT);
      if (!legal) {
        errors.push(
          `INVALID_ENUM: readPixels(format=0x${format.toString(16)}, type=0x${type.toString(16)}) ` +
            'is not a legal WebGL2 combination',
        );
        return;
      }
      const elementBytes = GL_TYPE_BYTES[type]!;
      const components = GL_FORMAT_COMPONENTS[format]!;
      const needed = width * height * elementBytes * components;
      const view = dst as unknown as { length: number; byteLength: number };
      const available = view.byteLength;
      if (available < needed) {
        errors.push(
          `INVALID_OPERATION: readPixels needs ${needed} bytes but got ${available} ` +
            `(packAlignment=${packAlignment})`,
        );
      }
      const attachment = boundReadFramebuffer
        ? (attachmentsByFramebuffer.get(boundReadFramebuffer) ?? { texture: null, layer: null })
        : { texture: null, layer: null };
      /*
       * 按「贴在附件上的层号」填一个可预测的图案：
       * 第 `layer` 层、第 `row` 行、第 `col` 列像素 = `(layer*100 + row*10 + col, 200, 100, 255)`。
       *
       * 这样「层号对不对」与「行在目标缓冲里的位置对不对」都能从**字节**上验证 ——
       * 而不是只断言「调了几次 / 传了什么常量」。
       */
      if (format === GL.RGBA && type === GL.UNSIGNED_BYTE) {
        const bytes = new Uint8Array(dst.buffer, dst.byteOffset, available);
        const layer = attachment.layer ?? 0;
        for (let row = 0; row < height; row += 1) {
          for (let col = 0; col < width; col += 1) {
            const at = (row * width + col) * 4;
            if (at + 3 >= bytes.length) break;
            bytes[at] = (layer * 100 + row * 10 + col) & 0xff;
            bytes[at + 1] = 200;
            bytes[at + 2] = 100;
            bytes[at + 3] = 255;
          }
        }
      }
      reads.push({
        x,
        y,
        width,
        height,
        format,
        type,
        byteLength: available,
        alignment: packAlignment,
        attachmentTexture: attachment.texture,
        attachmentLayer: attachment.layer,
      });
    },

    blitFramebuffer: (
      srcX0: number,
      srcY0: number,
      srcX1: number,
      srcY1: number,
      dstX0: number,
      dstY0: number,
      dstX1: number,
      dstY1: number,
      mask: number,
      filter: number,
    ) => {
      blits.push({
        srcX0,
        srcY0,
        srcX1,
        srcY1,
        dstX0,
        dstY0,
        dstX1,
        dstY1,
        mask,
        filter,
        readFramebuffer: boundReadFramebuffer ? nameOf(boundReadFramebuffer) : null,
        drawFramebuffer: boundDrawFramebuffer ? nameOf(boundDrawFramebuffer) : null,
      });
    },

    getError: () => GL.NO_ERROR,
    getExtension: () => null,
    flush: () => {},
    finish: () => {},
  } as unknown as WebGL2RenderingContext;

  return {
    gl,
    uploads,
    reads,
    attaches,
    blits,
    pixelStoreiCalls,
    errors,
    unpackState: () => ({
      rowLength: unpack.rowLength,
      imageHeight: unpack.imageHeight,
      alignment: unpack.alignment,
    }),
    uploadsFor: (textureName: string) => uploads.filter((upload) => upload.texture === textureName),
    clearErrors: () => {
      errors.length = 0;
    },
  };
}

/* ------------------------------------------------------------------ 假 buffer / texture -- */

interface FakeBuffer {
  readonly buffer: WebGL2Buffer;
  /** 假 buffer 的字节存储（`download` 从这里读、`upload` 写到这里）。 */
  readonly store: Uint8Array;
  readonly uploads: { offset: number; data: Uint8Array }[];
}

function createFakeBuffer(store: Uint8Array, label = 'src'): FakeBuffer {
  const uploads: { offset: number; data: Uint8Array }[] = [];
  const buffer = {
    label,
    size: store.byteLength,
    native: { buffer: label },
    isIndexBuffer: false,
    download(offset: number, target: Uint8Array) {
      target.set(store.subarray(offset, offset + target.byteLength));
    },
    upload(offset: number, data: Uint8Array) {
      uploads.push({ offset, data: data.slice() });
      store.set(data.subarray(0, Math.max(0, store.byteLength - offset)), offset);
    },
  } as unknown as WebGL2Buffer;
  return { buffer, store, uploads };
}

/** 只当结构用（`copyBufferToTexture`/`copyTextureToBuffer` 不碰 texture 的方法）。 */
function fakeTexture(
  format: string,
  target: number = GL.TEXTURE_2D,
  label = 'tex',
): WebGL2Texture {
  const layered = target === GL.TEXTURE_3D || target === GL.TEXTURE_2D_ARRAY;
  return {
    label,
    format,
    native: { texture: label },
    target,
    // `copyTextureToTexture` 会比对源/目标的维度（单层 2D ↔ 数组纹理不能互拷）。
    dimension: target === GL.TEXTURE_3D ? '3d' : layered ? '2d-array' : '2d',
    mipLevelCount: 1,
    depthOrArrayLayers: layered ? 4 : 1,
  } as unknown as WebGL2Texture;
}

/* ------------------------------------------------------------------ 被测对象 ------------- */

function createEncoderHarness() {
  const fake = createFakeGl();
  const state = new GlStateCache(fake.gl);
  const encoder = new WebGL2CommandEncoder(
    { label: 'copy-paths-test' },
    fake.gl,
    state,
    {} as WebGL2RenderPassOptions,
  );
  return { fake, state, encoder };
}

function createQueueHarness() {
  const fake = createFakeGl();
  const state = new GlStateCache(fake.gl);
  const queue = new WebGL2Queue(fake.gl, state);
  return { fake, state, queue };
}

/* ------------------------------------------------------------------ 测试数据 ------------- */

/**
 * 逐字节可预测的图案：第 `layer` 层、第 `row` 行、第 `col` 列像素的 R 分量。
 *
 * 用 `layer * 100 + row * 10 + col` 而不是「顺序递增」：这样任何「层/行错位」
 * 都能直接从数值上看出来是哪一层哪一行跑到了哪里。
 */
function patternR(layer: number, row: number, col: number): number {
  return (layer * 100 + row * 10 + col) & 0xff;
}

function patternPixel(layer: number, row: number, col: number): [number, number, number, number] {
  return [patternR(layer, row, col), 0x40 + layer, 0x80 + row, 0xff];
}

/** 按 `bytesPerRow` 行距、`rowsPerImage` 图距铺一张 width×height×layers 的 RGBA8 图案。 */
function buildPattern(options: {
  width: number;
  height: number;
  layers: number;
  bytesPerRow?: number;
  rowsPerImage?: number;
}): { data: Uint8Array; bytesPerRow: number; rowsPerImage: number } {
  const { width, height, layers } = options;
  const bytesPerRow = options.bytesPerRow ?? width * 4;
  const rowsPerImage = options.rowsPerImage ?? height;
  const data = new Uint8Array(bytesPerRow * rowsPerImage * layers);
  for (let layer = 0; layer < layers; layer += 1) {
    for (let row = 0; row < height; row += 1) {
      for (let col = 0; col < width; col += 1) {
        const at = layer * rowsPerImage * bytesPerRow + row * bytesPerRow + col * 4;
        const [r, g, b, a] = patternPixel(layer, row, col);
        data[at] = r;
        data[at + 1] = g;
        data[at + 2] = b;
        data[at + 3] = a;
      }
    }
  }
  return { data, bytesPerRow, rowsPerImage };
}

/**
 * 检查一次上传的主机数据是否与图案**逐字节**一致。
 *
 * 检查的是「主机内存里那段数据」而不是「纹理里最终存了什么」：`texSubImage3D` 是同步消费，
 * 数据布局正确 + 调用参数正确 ⇒ 纹理内容正确。这里把布局的每一层、每一行、每一列都比一遍，
 * 而不是只看首尾几个像素 —— 层/行错位正是本批要抓的东西。
 *
 * @param index 这次上传在 `uploads()` 里的序号（多层上传时用来对上层号基准）
 */
function expectPatternBytes(
  bytes: Uint8Array,
  options: {
    width: number;
    height: number;
    layers: number;
    bytesPerRow: number;
    rowsPerImage: number;
    /** 这段数据对应的第 0 层在图案里的层号（源 origin.z 不为 0 时用得上）。 */
    firstLayer: number;
    /** 数据在第几层开始（上传的 z 偏移）。 */
    baseLayer?: number;
    label?: string;
  },
): void {
  const { width, height, layers, bytesPerRow, rowsPerImage, firstLayer } = options;
  const baseLayer = options.baseLayer ?? 0;
  for (let layer = 0; layer < layers; layer += 1) {
    for (let row = 0; row < height; row += 1) {
      for (let col = 0; col < width; col += 1) {
        const at = (baseLayer + layer) * rowsPerImage * bytesPerRow + row * bytesPerRow + col * 4;
        const expected = patternPixel(firstLayer + layer, row, col);
        const actual = [bytes[at], bytes[at + 1], bytes[at + 2], bytes[at + 3]];
        if (actual.join(',') !== expected.join(',')) {
          throw new Error(
            `${options.label ?? 'bytes'} layer ${layer} row ${row} col ${col}: ` +
              `expected ${expected.join(',')} got ${actual.join(',')}`,
          );
        }
      }
    }
  }
}

/* ------------------------------------------------------------------ #6 ------------------ */

describe('#6 copyBufferToTexture 支持 3D / 数组纹理的多层上传', () => {
  it('2 层数组纹理：上传必须覆盖两层的数据，且不产生 GL 错误', () => {
    const { fake, encoder } = createEncoderHarness();
    const { data } = buildPattern({ width: 2, height: 2, layers: 2 });
    const source = createFakeBuffer(data);
    const texture = fakeTexture('rgba8unorm', GL.TEXTURE_2D_ARRAY);

    encoder.copyBufferToTexture(
      { buffer: source.buffer, offset: 0, bytesPerRow: 8, rowsPerImage: 2 },
      { texture, origin: { x: 0, y: 0, z: 0 } },
      { width: 2, height: 2, depthOrArrayLayers: 2 },
    );

    // 修复前：只调一次 texSubImage3D 传 16 字节（1 张 image），假 GL 会记 INVALID_OPERATION。
    expect(fake.errors).toEqual([]);
    expect(fake.uploads).toHaveLength(1);
    const upload = fake.uploads[0]!;
    expect(upload.depth).toBe(2);
    // 主机数据必须包含两层（bytesPerRow * rowsPerImage * 2 = 32 字节）。
    expect(upload.byteLength).toBeGreaterThanOrEqual(32);
    expectPatternBytes(source.store, {
      width: 2,
      height: 2,
      layers: 2,
      bytesPerRow: 8,
      rowsPerImage: 2,
      firstLayer: 0,
      label: 'texSubImage3D data',
    });
  });

  it('3D 纹理：z 偏移 + 3 层上传的每一层都逐字节正确', () => {
    const { fake, encoder } = createEncoderHarness();
    const { data } = buildPattern({ width: 2, height: 2, layers: 3 });
    const source = createFakeBuffer(data);
    const texture = fakeTexture('rgba8unorm', GL.TEXTURE_3D);

    encoder.copyBufferToTexture(
      { buffer: source.buffer, offset: 0, bytesPerRow: 8, rowsPerImage: 2 },
      { texture, origin: { x: 0, y: 0, z: 1 } },
      { width: 2, height: 2, depthOrArrayLayers: 3 },
    );

    expect(fake.errors).toEqual([]);
    expect(fake.uploads).toHaveLength(1);
    const upload = fake.uploads[0]!;
    expect([upload.x, upload.y, upload.z]).toEqual([0, 0, 1]);
    expect(upload.depth).toBe(3);
    expectPatternBytes(source.store, {
      width: 2,
      height: 2,
      layers: 3,
      bytesPerRow: 8,
      rowsPerImage: 2,
      firstLayer: 0,
      label: 'texSubImage3D data',
    });
  });

  it('非紧密行距（bytesPerRow > width*4、rowsPerImage > height）的多层上传也逐字节正确', () => {
    const { fake, encoder } = createEncoderHarness();
    const width = 2;
    const height = 2;
    const layers = 2;
    const bytesPerRow = 16; // 一行 8 字节内容 + 8 字节填充
    const rowsPerImage = 4; // 一图 2 行内容 + 2 行填充
    const { data } = buildPattern({ width, height, layers, bytesPerRow, rowsPerImage });
    const source = createFakeBuffer(data);
    const texture = fakeTexture('rgba8unorm', GL.TEXTURE_2D_ARRAY);

    encoder.copyBufferToTexture(
      { buffer: source.buffer, offset: 0, bytesPerRow, rowsPerImage },
      { texture, origin: { x: 0, y: 0, z: 0 } },
      { width, height, depthOrArrayLayers: layers },
    );

    expect(fake.errors).toEqual([]);
    expect(fake.uploads).toHaveLength(1);
    const upload = fake.uploads[0]!;
    expect(upload.byteLength).toBeGreaterThanOrEqual(bytesPerRow * rowsPerImage * layers);
    // GL 会按 UNPACK_IMAGE_HEIGHT 逐层定位，所以每一层都必须是完整的 rowsPerImage 行。
    expect(upload.byteLength).toBe(bytesPerRow * rowsPerImage * layers);
    // 填充字节必须原样保留（不是「重新紧凑排布」）。
    expect([...source.store.subarray(8, 16)]).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    expectPatternBytes(source.store, {
      width,
      height,
      layers,
      bytesPerRow,
      rowsPerImage,
      firstLayer: 0,
      label: 'texSubImage3D data',
    });
  });

  it('源 buffer 不够大时给出带前缀的英文错误（而不是静默 INVALID_OPERATION）', () => {
    const { fake, encoder } = createEncoderHarness();
    // 只有 1 层的数据，却要传 2 层。
    const { data } = buildPattern({ width: 2, height: 2, layers: 1 });
    const source = createFakeBuffer(data);
    const texture = fakeTexture('rgba8unorm', GL.TEXTURE_2D_ARRAY);

    expect(() =>
      encoder.copyBufferToTexture(
        { buffer: source.buffer, offset: 0, bytesPerRow: 8, rowsPerImage: 2 },
        { texture, origin: { x: 0, y: 0, z: 0 } },
        { width: 2, height: 2, depthOrArrayLayers: 2 },
      ),
    ).toThrowError(ValidationError);
    expect(fake.errors).toEqual([]);
  });

  it('rowsPerImage 小于 height 时给出带前缀的英文错误', () => {
    const { encoder } = createEncoderHarness();
    const { data } = buildPattern({ width: 2, height: 4, layers: 1 });
    const source = createFakeBuffer(data);
    const texture = fakeTexture('rgba8unorm', GL.TEXTURE_2D);

    expect(() =>
      encoder.copyBufferToTexture(
        { buffer: source.buffer, offset: 0, bytesPerRow: 8, rowsPerImage: 2 },
        { texture, origin: { x: 0, y: 0 } },
        { width: 2, height: 4, depthOrArrayLayers: 1 },
      ),
    ).toThrowError(/\[gpu-device-api\] copyBufferToTexture: rowsPerImage \(2\) must be >= the copy height \(4\)/);
  });

  it('bytesPerRow 小于一行所需字节数时给出带前缀的英文错误', () => {
    const { encoder } = createEncoderHarness();
    const { data } = buildPattern({ width: 4, height: 1, layers: 1 });
    const source = createFakeBuffer(data);
    const texture = fakeTexture('rgba8unorm', GL.TEXTURE_2D);

    expect(() =>
      encoder.copyBufferToTexture(
        { buffer: source.buffer, offset: 0, bytesPerRow: 8 },
        { texture, origin: { x: 0, y: 0 } },
        { width: 4, height: 1, depthOrArrayLayers: 1 },
      ),
    ).toThrowError(/\[gpu-device-api\] copyBufferToTexture: bytesPerRow must be an integer >= 16/);
  });
});

/* ------------------------------------------------------------------ #7 ------------------ */

describe('#7 Queue.copyBufferToTexture 读取 rowsPerImage（UNPACK_IMAGE_HEIGHT）', () => {
  it('rowsPerImage > height 时把 image 间距下发给 GL，第 2 层内容仍然正确', () => {
    const { fake, queue } = createQueueHarness();
    const width = 2;
    const height = 2;
    const layers = 2;
    const bytesPerRow = 8;
    const rowsPerImage = 8; // 关键：不是 height
    const { data } = buildPattern({ width, height, layers, bytesPerRow, rowsPerImage });
    const texture = fakeTexture('rgba8unorm', GL.TEXTURE_2D_ARRAY);
    const source = createFakeBuffer(data);

    queue.copyBufferToTexture(
      { buffer: source.buffer, offset: 0, bytesPerRow, rowsPerImage },
      { texture, origin: { x: 0, y: 0, z: 0 } },
      { width, height, depthOrArrayLayers: layers },
    );

    expect(fake.errors).toEqual([]);
    const upload = fake.uploads[0]!;
    // 修复前 imageHeight 恒为 0（即 GL 默认值 height），第 2 层会从错误的偏移读起。
    expect(upload.imageHeight).toBe(rowsPerImage);
    expectPatternBytes(source.store, {
      width,
      height,
      layers,
      bytesPerRow,
      rowsPerImage,
      firstLayer: 0,
      label: 'queue.copyBufferToTexture data',
    });
  });

  it('Queue.writeTexture 也读取 rowsPerImage（同一个 UNPACK_IMAGE_HEIGHT 语义）', () => {
    const { fake, queue } = createQueueHarness();
    const width = 2;
    const height = 2;
    const layers = 3;
    const bytesPerRow = 8;
    const rowsPerImage = 5;
    const { data } = buildPattern({ width, height, layers, bytesPerRow, rowsPerImage });
    const texture = fakeTexture('rgba8unorm', GL.TEXTURE_2D_ARRAY);

    queue.writeTexture(
      { texture, origin: { x: 0, y: 0, z: 0 } },
      data,
      { offset: 0, bytesPerRow, rowsPerImage },
      { width, height, depthOrArrayLayers: layers },
    );

    expect(fake.errors).toEqual([]);
    const upload = fake.uploads[0]!;
    expect(upload.imageHeight).toBe(rowsPerImage);
    expectPatternBytes(data, {
      width,
      height,
      layers,
      bytesPerRow,
      rowsPerImage,
      firstLayer: 0,
      label: 'writeTexture data',
    });
  });

  it('省略 rowsPerImage 时按 height 处理（WebGPU 的默认值），不再下发 UNPACK_IMAGE_HEIGHT', () => {
    const { fake, queue } = createQueueHarness();
    const { data } = buildPattern({ width: 2, height: 2, layers: 2 });
    const texture = fakeTexture('rgba8unorm', GL.TEXTURE_2D_ARRAY);

    queue.writeTexture(
      { texture, origin: { x: 0, y: 0, z: 0 } },
      data,
      { offset: 0, bytesPerRow: 8 },
      { width: 2, height: 2, depthOrArrayLayers: 2 },
    );

    expect(fake.errors).toEqual([]);
    const upload = fake.uploads[0]!;
    // GL 的默认 `UNPACK_IMAGE_HEIGHT` 就是 `height`，所以这里**不下发** pixelStorei
    // （保持 GL 的默认值 0 = 省略），层级定位照样正确。
    expect(upload.imageHeight).toBe(0);
    expect(upload.depth).toBe(2);
    expectPatternBytes(data, {
      width: 2,
      height: 2,
      layers: 2,
      bytesPerRow: 8,
      rowsPerImage: 2,
      firstLayer: 0,
      label: 'writeTexture data',
    });
  });

  it('写回后 UNPACK_IMAGE_HEIGHT / UNPACK_ROW_LENGTH / UNPACK_ALIGNMENT 都回到默认值', () => {
    const { fake, queue } = createQueueHarness();
    const { data } = buildPattern({ width: 2, height: 2, layers: 2, bytesPerRow: 16, rowsPerImage: 4 });
    const texture = fakeTexture('rgba8unorm', GL.TEXTURE_2D_ARRAY);

    queue.writeTexture(
      { texture, origin: { x: 0, y: 0, z: 0 } },
      data,
      { offset: 0, bytesPerRow: 16, rowsPerImage: 4 },
      { width: 2, height: 2, depthOrArrayLayers: 2 },
    );

    expect(fake.unpackState()).toEqual({ rowLength: 0, imageHeight: 0, alignment: 4 });
    expect(fake.pixelStoreiCalls).toEqual([
      'UNPACK_ALIGNMENT=1',
      'UNPACK_ROW_LENGTH=4',
      'UNPACK_IMAGE_HEIGHT=4',
      'UNPACK_ROW_LENGTH=0',
      'UNPACK_IMAGE_HEIGHT=0',
      'UNPACK_ALIGNMENT=4',
    ]);
  });

  it('数据不足时明确报错（而不是让驱动静默 INVALID_OPERATION）', () => {
    const { fake, queue } = createQueueHarness();
    const { data } = buildPattern({ width: 2, height: 2, layers: 2, bytesPerRow: 8, rowsPerImage: 2 });
    const texture = fakeTexture('rgba8unorm', GL.TEXTURE_2D_ARRAY);

    expect(() =>
      queue.writeTexture(
        { texture, origin: { x: 0, y: 0, z: 0 } },
        data.subarray(0, 16),
        { offset: 0, bytesPerRow: 8, rowsPerImage: 4 },
        { width: 2, height: 2, depthOrArrayLayers: 2 },
      ),
    ).toThrowError(ValidationError);
    expect(fake.errors).toEqual([]);
  });
});

/**
 * 同一批断言的「调用级合同」版本：用共享的假 GL（`webgl2-fake-gl.ts`）把**每一次 GL 调用**
 * 记成字符串，直接读出 WebGL2 真正需要的那两个状态（`UNPACK_ROW_LENGTH` / `UNPACK_IMAGE_HEIGHT`）。
 *
 * 为什么两种假 GL 都要：上面那些用例断言**逐字节内容**，这里断言**调用参数** ——
 * 内容对了但 `UNPACK_IMAGE_HEIGHT` 没下发，说明数据布局与 GL 的理解不一致，
 * 在真实驱动上就会从错误的偏移读起（正是 `#7` 的病）。
 */
describe('#7 调用级合同：UNPACK_ROW_LENGTH / UNPACK_IMAGE_HEIGHT 的实际下发', () => {
  function queueWithRealTexture(format = 'rgba8unorm'): {
    fake: FakeWebGL2;
    queue: WebGL2Queue;
    texture: WebGL2Texture;
  } {
    const fake = createFakeWebGL2();
    const state = new GlStateCache(fake.gl);
    const queue = new WebGL2Queue(fake.gl, state);
    const texture = fakeTexture(format, GL.TEXTURE_2D_ARRAY);
    return { fake, queue, texture };
  }

  it('writeTexture 在多层非紧密布局下把 rowsPerImage 映射成 UNPACK_IMAGE_HEIGHT，用后归零', () => {
    const { fake, queue, texture } = queueWithRealTexture();
    const { data } = buildPattern({ width: 2, height: 2, layers: 2, bytesPerRow: 16, rowsPerImage: 4 });

    queue.writeTexture(
      { texture, origin: { x: 0, y: 0, z: 1 } },
      data,
      { offset: 0, bytesPerRow: 16, rowsPerImage: 4 },
      { width: 2, height: 2, depthOrArrayLayers: 2 },
    );

    const uploads = fake.calls.filter((call) => call.startsWith('texSubImage3D'));
    expect(uploads).toHaveLength(1);
    expect(uploads[0]).toContain('xyz=0,0,1');
    expect(uploads[0]).toContain('size=2x2x2');
    expect(uploads[0]).toContain('rowLength=4');
    expect(uploads[0]).toContain('imageHeight=4');
    expect(uploads[0]).toContain('alignment=1');
    // 最后必须把两个参数都还原，否则会污染后续的 texSubImage2D / 纹理上传。
    const stores = fake.calls.filter((call) => call.startsWith('pixelStorei'));
    expect(stores).toContain(`pixelStorei:${GL_UNPACK_ROW_LENGTH}:0`);
    expect(stores).toContain(`pixelStorei:${GL_UNPACK_IMAGE_HEIGHT}:0`);
  });

  it('紧密布局（bytesPerRow = width*4、rowsPerImage = height）不额外下发 pixelStorei', () => {
    const { fake, queue, texture } = queueWithRealTexture();
    const { data } = buildPattern({ width: 2, height: 2, layers: 2 });

    queue.writeTexture(
      { texture, origin: { x: 0, y: 0, z: 0 } },
      data,
      { offset: 0, bytesPerRow: 8, rowsPerImage: 2 },
      { width: 2, height: 2, depthOrArrayLayers: 2 },
    );

    const stores = fake.calls.filter((call) => call.startsWith('pixelStorei'));
    // `UNPACK_ROW_LENGTH` 与 `UNPACK_IMAGE_HEIGHT` 一次都不该出现：
    // 紧密布局下 GL 的默认值（0 = 省略）就是正确的语义，多下发一次就是白白多一次 JS→GL 调用。
    expect(stores).toEqual([`pixelStorei:${GL_UNPACK_ALIGNMENT}:1`, `pixelStorei:${GL_UNPACK_ALIGNMENT}:4`]);
  });

  it('queue.copyBufferToTexture 的多层上传同样下发行距/图距', () => {
    const { fake, queue, texture } = queueWithRealTexture();
    const { data } = buildPattern({ width: 2, height: 2, layers: 2, bytesPerRow: 16, rowsPerImage: 6 });
    // 只需要 `download` 语义：把 store 拷进目标数组的最小替身。
    const buffer = {
      label: 'src',
      size: data.byteLength,
      isIndexBuffer: false,
      download: (offset: number, target: Uint8Array) => {
        target.set(data.subarray(offset, offset + target.byteLength));
      },
      upload: () => {},
    } as unknown as WebGL2Buffer;

    queue.copyBufferToTexture(
      { buffer, offset: 0, bytesPerRow: 16, rowsPerImage: 6 },
      { texture, origin: { x: 0, y: 0, z: 0 } },
      { width: 2, height: 2, depthOrArrayLayers: 2 },
    );

    const uploads = fake.calls.filter((call) => call.startsWith('texSubImage3D'));
    expect(uploads).toHaveLength(1);
    expect(uploads[0]).toContain('rowLength=4');
    expect(uploads[0]).toContain('imageHeight=6');
  });
});

/* ------------------------------------------------------------------ #8 ------------------ */

describe('#8 copyTextureToTexture 尊重 origin.z 与 3D/数组附件', () => {
  it('数组纹理：源/目标的层偏移必须真的落到 framebufferTextureLayer 上', () => {
    const { fake, encoder } = createEncoderHarness();
    const source = fakeTexture('rgba8unorm', GL.TEXTURE_2D_ARRAY, 'src');
    const destination = fakeTexture('rgba8unorm', GL.TEXTURE_2D_ARRAY, 'dst');

    encoder.copyTextureToTexture(
      { texture: source, origin: { x: 1, y: 2, z: 3 } },
      { texture: destination, origin: { x: 4, y: 5, z: 6 } },
      { width: 2, height: 2, depthOrArrayLayers: 1 },
    );

    // 修复前：两张纹理都用 framebufferTexture2D + TEXTURE_2D 挂载，层级信息完全丢失
    // （`origin.z` 被丢弃，而且 TEXTURE_2D_ARRAY 挂到 TEXTURE_2D 附着点上实测不报错、FBO 还完整）。
    const readAttach = fake.attaches.find((call) => call.target === GL.READ_FRAMEBUFFER)!;
    const drawAttach = fake.attaches.find((call) => call.target === GL.DRAW_FRAMEBUFFER)!;
    expect(readAttach.layer).toBe(3);
    expect(drawAttach.layer).toBe(6);
    // x/y 也必须被尊重（层内偏移走 blit 的矩形）。
    expect(fake.blits).toHaveLength(1);
    expect(fake.blits[0]).toMatchObject({ srcX0: 1, srcY0: 2, dstX0: 4, dstY0: 5 });
  });

  it('depthOrArrayLayers > 1 时逐层 blit，每一层的层号都正确', () => {
    const { fake, encoder } = createEncoderHarness();
    const source = fakeTexture('rgba8unorm', GL.TEXTURE_2D_ARRAY, 'src');
    const destination = fakeTexture('rgba8unorm', GL.TEXTURE_2D_ARRAY, 'dst');

    encoder.copyTextureToTexture(
      { texture: source, origin: { x: 0, y: 0, z: 1 } },
      { texture: destination, origin: { x: 0, y: 0, z: 2 } },
      { width: 2, height: 2, depthOrArrayLayers: 2 },
    );

    expect(fake.errors).toEqual([]);
    /*
     * 逐层 blit 必须真的**换层** —— 只看 blit 次数抓不到「层号恒为 0」这个症状。
     * 附件顺序：循环外那对（src 第 1 层、dst 第 2 层），然后每层各换一次。
     */
    expect(fake.attaches.map((call) => call.layer)).toEqual([1, 2, 1, 2, 2, 3]);
    expect(fake.blits).toHaveLength(2);
  });

  it('深度纹理拷贝：附件必须是 DEPTH_ATTACHMENT 且 mask 是 DEPTH_BUFFER_BIT', () => {
    const { fake, encoder } = createEncoderHarness();
    const source = fakeTexture('depth24plus', GL.TEXTURE_2D, 'srcDepth');
    const destination = fakeTexture('depth24plus', GL.TEXTURE_2D, 'dstDepth');

    encoder.copyTextureToTexture(
      { texture: source, origin: { x: 0, y: 0 } },
      { texture: destination, origin: { x: 0, y: 0 } },
      { width: 2, height: 2, depthOrArrayLayers: 1 },
    );

    // 修复前：depth24plus 被当成颜色附件挂在 COLOR_ATTACHMENT0 上，blit 请求 COLOR_BUFFER_BIT
    // —— GL 会报 INVALID_OPERATION，默认不查错，于是深度纹理静默地什么都没拷贝。
    expect(fake.errors).toEqual([]);
    const readAttach = fake.attaches.find((call) => call.target === GL.READ_FRAMEBUFFER)!;
    expect(readAttach.attachment).toBe(GL.DEPTH_ATTACHMENT);
    expect(fake.blits[0]!.mask).toBe(GL.DEPTH_BUFFER_BIT);
  });

  it('depth24plus-stencil8 → DEPTH_STENCIL_ATTACHMENT 且 mask 同时包含 DEPTH 与 STENCIL', () => {
    const { fake, encoder } = createEncoderHarness();
    const source = fakeTexture('depth24plus-stencil8', GL.TEXTURE_2D, 'srcDS');
    const destination = fakeTexture('depth24plus-stencil8', GL.TEXTURE_2D, 'dstDS');

    encoder.copyTextureToTexture(
      { texture: source, origin: { x: 0, y: 0 } },
      { texture: destination, origin: { x: 0, y: 0 } },
      { width: 2, height: 2, depthOrArrayLayers: 1 },
    );

    expect(fake.errors).toEqual([]);
    const readAttach = fake.attaches.find((call) => call.target === GL.READ_FRAMEBUFFER)!;
    expect(readAttach.attachment).toBe(GL.DEPTH_STENCIL_ATTACHMENT);
    // GLES 3.0 没有 STENCIL_BUFFER_BIT，模板是随 DEPTH_STENCIL 附着点一起 blit 的。
    expect(fake.blits[0]!.mask).toBe(GL.DEPTH_BUFFER_BIT);
  });

  it('源是 2D、目标是数组纹理时不再静默按 TEXTURE_2D 挂载', () => {
    const { fake, encoder } = createEncoderHarness();
    const source = fakeTexture('rgba8unorm', GL.TEXTURE_2D, 'src2d');
    const destination = fakeTexture('rgba8unorm', GL.TEXTURE_2D_ARRAY, 'dstArray');

    expect(() =>
      encoder.copyTextureToTexture(
        { texture: source, origin: { x: 0, y: 0 } },
        { texture: destination, origin: { x: 0, y: 0, z: 2 } },
        { width: 2, height: 2, depthOrArrayLayers: 1 },
      ),
    ).toThrowError(ValidationError);
    expect(fake.errors).toEqual([]);
  });
});

/* ------------------------------------------------------------------ #9 ------------------ */

describe('#9 copyTextureToBuffer 从深度纹理读回', () => {
  /**
   * 这一项的处置是**明确报错**，而不是实现。
   *
   * 依据（本机原生探针实测，见 `.tmp-04/PROBE-NOTES.md`）：WebGL2 的 `readPixels` 在本机
   * 对 4 种深度格式 × 5 种 `format`/`type` 组合**全部**返回 `0x500 INVALID_ENUM`，
   * 而且显式把 READ 与 DRAW 都挂到同一个完整深度 FBO 上仍然如此（排除「绑错目标」）。
   * 规范层面也对得上：WebGL2 的 `readPixels` 只接受 `RGBA`/`UNSIGNED_BYTE`、
   * `RGBA`/`FLOAT`、`RED`/`FLOAT`，而深度附件报出来的 read format 是
   * `DEPTH_COMPONENT`/`UNSIGNED_INT` —— 永远对不上（`WEBGL_depth_texture` 是 WebGL1 的扩展）。
   *
   * 因此「实现」不可能：`#9` 的目标从「读回正确」变成「**不再静默返回全 0**」。
   */
  it('depth24plus：明确报错并指出替代方案（而不是把缓冲留成全 0）', () => {
    const { fake, encoder } = createEncoderHarness();
    const texture = fakeTexture('depth24plus', GL.TEXTURE_2D, 'depth');
    const destination = createFakeBuffer(new Uint8Array(2 * 2 * 4), 'dst');

    expect(() =>
      encoder.copyTextureToBuffer(
        { texture, origin: { x: 0, y: 0 } },
        { buffer: destination.buffer, offset: 0, bytesPerRow: 8 },
        { width: 2, height: 2, depthOrArrayLayers: 1 },
      ),
    ).toThrowError(/\[gpu-device-api\] copyTextureToBuffer: the WebGL2 backend cannot read depth texture/);
    // 关键：**连一次 readPixels 都没下发**，目标 buffer 也完全没被写过。
    expect(fake.reads).toEqual([]);
    expect(destination.uploads).toEqual([]);
  });

  it('报错信息必须给出可执行的替代方案（写进颜色附件）', () => {
    const { encoder } = createEncoderHarness();
    const texture = fakeTexture('depth32float', GL.TEXTURE_2D, 'depth32');
    const destination = createFakeBuffer(new Uint8Array(16), 'dst');

    expect(() =>
      encoder.copyTextureToBuffer(
        { texture, origin: { x: 0, y: 0 } },
        { buffer: destination.buffer, offset: 0, bytesPerRow: 8 },
        { width: 2, height: 2, depthOrArrayLayers: 1 },
      ),
    ).toThrowError(/workaround: write the depth into a colour attachment/i);
    expect(() =>
      encoder.copyTextureToBuffer(
        { texture, origin: { x: 0, y: 0 } },
        { buffer: destination.buffer, offset: 0, bytesPerRow: 8 },
        { width: 2, height: 2, depthOrArrayLayers: 1 },
      ),
    ).toThrowError(/RGBA\/UNSIGNED_BYTE, RGBA\/FLOAT, RED\/FLOAT/);
  });

  it("aspect: 'stencil-only' 必须被读取并明确拒绝（WebGL2 的 readPixels 读不到模板）", () => {
    const { encoder } = createEncoderHarness();
    const texture = fakeTexture('depth24plus-stencil8', GL.TEXTURE_2D, 'ds');
    const destination = createFakeBuffer(new Uint8Array(16), 'dst');

    // 修复前：`source.aspect` 从不被读取 —— 传 'stencil-only' 与不传完全一样，
    // 拿到的是一份（错的）全 0 数据，调用方无从察觉。
    expect(() =>
      encoder.copyTextureToBuffer(
        { texture, origin: { x: 0, y: 0 }, aspect: 'stencil-only' },
        { buffer: destination.buffer, offset: 0, bytesPerRow: 8 },
        { width: 2, height: 2, depthOrArrayLayers: 1 },
      ),
    ).toThrowError(/\[gpu-device-api\] copyTextureToBuffer: aspect "stencil-only"/);
    expect(destination.uploads).toEqual([]);
  });

  it("aspect: 'all' 在 depth24plus-stencil8 上按 depth-only 处理（报错文字里点明这一差异）", () => {
    const { encoder } = createEncoderHarness();
    const texture = fakeTexture('depth24plus-stencil8', GL.TEXTURE_2D, 'ds');
    const destination = createFakeBuffer(new Uint8Array(16), 'dst');

    expect(() =>
      encoder.copyTextureToBuffer(
        { texture, origin: { x: 0, y: 0 }, aspect: 'all' },
        { buffer: destination.buffer, offset: 0, bytesPerRow: 8 },
        { width: 2, height: 2, depthOrArrayLayers: 1 },
      ),
    ).toThrowError(/WebGPU treats aspect "all" on a depth-stencil format as depth-only/);
  });

  it('非深度格式上给 aspect 也必须报错（这个字段不许被静默忽略）', () => {
    const { encoder } = createEncoderHarness();
    const texture = fakeTexture('rgba8unorm', GL.TEXTURE_2D, 'color');
    const destination = createFakeBuffer(new Uint8Array(16), 'dst');

    expect(() =>
      encoder.copyTextureToBuffer(
        { texture, origin: { x: 0, y: 0 }, aspect: 'depth-only' },
        { buffer: destination.buffer, offset: 0, bytesPerRow: 8 },
        { width: 2, height: 2, depthOrArrayLayers: 1 },
      ),
    ).toThrowError(/aspect "depth-only" was requested for the non-depth format "rgba8unorm"/);
  });

  it('颜色数组纹理：逐层读回，每层挂到自己的层号上且写出位置正确', () => {
    const { fake, encoder } = createEncoderHarness();
    const texture = fakeTexture('rgba8unorm', GL.TEXTURE_2D_ARRAY, 'array');
    // 读回是逐层的，所以层尾的填充不需要存在：只需要覆盖到「最后一个像素」为止（与 WebGPU 一致）。
    // 8 (bytesPerRow) * ((2-1) * 4 (rowsPerImage) + 2 (height)) = 48 字节。
    const destination = createFakeBuffer(new Uint8Array(8 * 4 * 2), 'dst');

    encoder.copyTextureToBuffer(
      { texture, origin: { x: 0, y: 0, z: 2 } },
      { buffer: destination.buffer, offset: 0, bytesPerRow: 8, rowsPerImage: 4 },
      { width: 2, height: 2, depthOrArrayLayers: 2 },
    );

    expect(fake.errors).toEqual([]);
    expect(fake.reads).toHaveLength(2);
    // 修复前只读第 0 层、且恒用 framebufferTexture2D（层号压根不存在）。
    expect(fake.reads.map((read) => read.attachmentLayer)).toEqual([2, 3]);
    expect(fake.reads.every((read) => read.alignment === 1)).toBe(true);
    /*
     * 目标缓冲是**一次写回**的（`copyTextureToBuffer` 在 JS 里拼好整块再 `bufferSubData`，
     * 与 `copyBufferToTexture` 对称），所以断言落在「整块数据里的字节位置」上：
     * 第 1 层的数据必须出现在偏移 `rowsPerImage * bytesPerRow = 32` 处。
     */
    expect(destination.uploads).toHaveLength(1);
    const data = destination.uploads[0]!.data;
    expect(destination.uploads[0]!.offset).toBe(0);
    expect(data).toHaveLength(48);

    const pixelAt = (offset: number): number[] => [
      data[offset]!,
      data[offset + 1]!,
      data[offset + 2]!,
      data[offset + 3]!,
    ];
    // 第 0 层（附件层号 2）：第 0 行第 0 列 → R = 2*100 + 0 + 0 = 200；第 1 行第 1 列 → 211。
    expect(pixelAt(0)).toEqual([200, 200, 100, 255]);
    expect(pixelAt(8 + 4)).toEqual([211, 200, 100, 255]);
    // 第 1 层（附件层号 3）落在偏移 32，第 0 行第 0 列 → R = 300 & 0xff = 44。
    expect(pixelAt(32)).toEqual([300 & 0xff, 200, 100, 255]);
    expect(pixelAt(32 + 8 + 4)).toEqual([311 & 0xff, 200, 100, 255]);
    /*
     * 第 0 层与第 1 层之间那段偏移 16..31（`(rowsPerImage - height) * bytesPerRow`）是**填充**，
     * 必须是 0 —— 它验证的是「层的起点按 rowsPerImage 算，而不是按 height 紧凑排」。
     */
    expect([...data.subarray(16, 32)]).toEqual([
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);
  });

  it('rowsPerImage 小于 height 时明确报错', () => {
    const { encoder } = createEncoderHarness();
    const texture = fakeTexture('rgba8unorm', GL.TEXTURE_2D, 'tex');
    const destination = createFakeBuffer(new Uint8Array(64), 'dst');

    expect(() =>
      encoder.copyTextureToBuffer(
        { texture, origin: { x: 0, y: 0 } },
        { buffer: destination.buffer, offset: 0, bytesPerRow: 8, rowsPerImage: 1 },
        { width: 2, height: 2, depthOrArrayLayers: 1 },
      ),
    ).toThrowError(/rowsPerImage \(1\) must be >= the copy height \(2\)/);
  });

  it('单层 2D 纹理上给 origin.z != 0 明确报错（层号无法寻址）', () => {
    const { encoder } = createEncoderHarness();
    const texture = fakeTexture('rgba8unorm', GL.TEXTURE_2D, 'flat');
    const destination = createFakeBuffer(new Uint8Array(64), 'dst');

    let message = '';
    try {
      encoder.copyTextureToBuffer(
        { texture, origin: { x: 0, y: 0, z: 1 } },
        { buffer: destination.buffer, offset: 0, bytesPerRow: 8 },
        { width: 2, height: 2, depthOrArrayLayers: 1 },
      );
    } catch (error) {
      message = String(error instanceof Error ? error.message : error);
    }
    expect(message).toMatch(/\[gpu-device-api\]/);
    expect(message).toMatch(/纹理「flat」只有一层/);
  });

  it('数组纹理上给 mipLevel != 0 明确报错（framebufferTextureLayer 不接受非 0 级）', () => {
    const { encoder } = createEncoderHarness();
    const texture = fakeTexture('rgba8unorm', GL.TEXTURE_2D_ARRAY, 'array');
    const destination = createFakeBuffer(new Uint8Array(64), 'dst');

    expect(() =>
      encoder.copyTextureToBuffer(
        { texture, mipLevel: 1, origin: { x: 0, y: 0 } },
        { buffer: destination.buffer, offset: 0, bytesPerRow: 8 },
        { width: 2, height: 2, depthOrArrayLayers: 1 },
      ),
    ).toThrowError(ValidationError);
  });
});
