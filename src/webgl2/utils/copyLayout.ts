/**
 * buffer ↔ texture 拷贝的内存布局计算与校验（WebGL2 后端）。
 *
 * ## 为什么需要单独一个文件
 *
 * 两条路径（`CommandEncoder.copyBufferToTexture` / `Queue.writeTexture`）与它们各自的
 * 相反方向（`copyTextureToBuffer`）都要做同一件事：把 core 的
 * {@link Extent3D} + {@link TexelCopyBufferLayout}（或 `BufferCopyView`）翻译成
 * 「主机内存里这段数据怎么排」以及「GL 需要知道哪些解包参数」。
 *
 * 以前这段逻辑在四个地方各写了一半，于是分别漏掉了 `rowsPerImage`、
 * 多层上传的字节数校验、深度读回的 `aspect` —— 全都是**静默**的。集中到这里之后，
 * 「调用方要准备多少字节」与「GL 要下发什么 `UNPACK_*`」是同一个函数的两个输出，
 * 不可能再对不上。
 *
 * ## WebGPU 的语义（本文件的唯一标准）
 *
 * - `bytesPerRow`：相邻两行**第一个字节**之间的距离。缺省是 `width * bytesPerPixel`。
 * - `rowsPerImage`：相邻两张 image（层）第一个字节之间的距离，**以行为单位**。缺省是 `height`。
 * - 数据总长（相对 `offset`）：
 *   `bytesPerRow * (rowsPerImage * (depthOrArrayLayers - 1) + height)`。
 *
 * GL 侧的对应关系（WebGL2 支持 `UNPACK_ROW_LENGTH` / `UNPACK_IMAGE_HEIGHT`，
 * 单位都是**像素/行**而不是字节）：
 *
 * - `UNPACK_ROW_LENGTH = bytesPerRow / bytesPerPixel`
 * - `UNPACK_IMAGE_HEIGHT = rowsPerImage`
 * - `UNPACK_ALIGNMENT = 1`（行首按元素大小对齐就够，不需要额外的行填充 —— 这与 WebGPU 一致）
 *
 * 已由只读原生探针确认（见 `.tmp-04/PROBE-NOTES.md` §2.4）：`texSubImage3D` 在
 * `UNPACK_ROW_LENGTH=4` / `UNPACK_IMAGE_HEIGHT=4` / `UNPACK_ALIGNMENT=1` 下
 * 会把第 1 层第 1 行的数据放在偏移 `1*4*16 + 1*16` 处，与上面的公式逐字节一致。
 *
 * ## 与 WebGPU 的**有意差异**：不检查 256 对齐
 *
 * WebGPU 规定「`height > 1` 时 `bytesPerRow` 必须是 256 的倍数」，而 WebGL2 没有这个限制。
 * 本后端**照字面接受**调用方给的行距（只要求 `>= width * bytesPerPixel` 且是整数）：
 * 上层用同一份代码写两个后端时，若行距不满足 WebGPU 的 256 对齐，WebGPU 会自己报错，
 * WebGL2 则如实按给定行距工作 —— 这比在 WebGL2 侧额外拒绝更宽容，也不会把一个
 * 在 WebGL2 上完全合法的用法误杀。
 */

import { ValidationError } from '../../core/errors/ValidationError.js';
import type { Extent3D, TexelCopyBufferLayout } from '../../types/internal.js';
import type { GlTextureFormatInfo } from './glFormatMap.js';

/** 一次拷贝在主机内存里的布局（已经校验过，可以直接用）。 */
export interface CopyLayout {
  /** 相邻两行第一个字节之间的距离。 */
  readonly bytesPerRow: number;
  /** 相邻两张 image 第一个字节之间的距离，以**行**为单位。 */
  readonly rowsPerImage: number;
  /** 一个像素几个字节。 */
  readonly bytesPerPixel: number;
  /** 相对源的 `offset`，这段数据需要多少字节。 */
  readonly requiredBytes: number;
  /**
   * GL 的 `UNPACK_ROW_LENGTH`；`0` 表示「省略」（等价于按请求的 `width` 紧密排布）。
   *
   * 之所以要区分 0 与真正的值：`0` 是 GL 的默认状态，紧密布局下不下发任何
   * `pixelStorei`，这条路径的 GL 调用序列与改动前**逐条相同**（像素基线依赖这一点）。
   */
  readonly unpackRowLength: number;
  /** GL 的 `UNPACK_IMAGE_HEIGHT`；`0` 表示省略（等价于 `height`）。 */
  readonly unpackImageHeight: number;
  /**
   * 是否必须逐行上传。
   *
   * `UNPACK_ROW_LENGTH` 的单位是**像素**，所以 `bytesPerRow` 必须是 `bytesPerPixel` 的整数倍
   * 才能用「一次 `texSubImage*` + 行距」表达。不是整数倍时（例如 4 字节像素却给了 13 字节行距）
   * GL 根本没有这个表达能力 —— 但**逐行**上传可以：每行都是一个独立、起点在行首的紧密子区间。
   *
   * 本后端选择「照字面生效」而不是报错：`copyTextureToBuffer` 那条路径（`PACK_*` 与
   * `readPixels`）本来就能处理任意行距，如果上传侧拒绝，两个方向的行为就不对称了。
   */
  readonly perRowUpload: boolean;
}

/** GL 像素类型 → 每个元素几个字节。只覆盖本后端会上传的类型。 */
const GL_TYPE_ELEMENT_BYTES: ReadonlyMap<number, number> = new Map([
  [0x1401, 1], // UNSIGNED_BYTE
  [0x1400, 1], // BYTE
  [0x1403, 2], // UNSIGNED_SHORT
  [0x1402, 2], // SHORT
  [0x1405, 4], // UNSIGNED_INT
  [0x1404, 4], // INT
  [0x1406, 4], // FLOAT
  [0x140b, 2], // HALF_FLOAT
  [0x8368, 4], // UNSIGNED_INT_2_10_10_10_REV
  [0x84fa, 4], // UNSIGNED_INT_24_8
]);

/** GL 像素类型 → 对应的主机 TypedArray 名字；用于给出可读的错误消息。 */
const GL_TYPE_NAMES: ReadonlyMap<number, string> = new Map([
  [0x1401, 'Uint8Array'],
  [0x1400, 'Int8Array'],
  [0x1403, 'Uint16Array'],
  [0x1402, 'Int16Array'],
  [0x1405, 'Uint32Array'],
  [0x1404, 'Int32Array'],
  [0x1406, 'Float32Array'],
  [0x140b, 'Uint16Array'],
  [0x8368, 'Uint32Array'],
  [0x84fa, 'Uint32Array'],
]);

/**
 * 一个 GL 像素元素（对应 `UNPACK_ALIGNMENT` 意义上的「元素」）几个字节。
 *
 * `UNSIGNED_INT_2_10_10_10_REV` 与 `UNSIGNED_INT_24_8` 这类打包类型按 GL 的规则是
 * 4 字节的整数元素 —— 与 `format` 的组件数**无关**（这一点很容易写错：
 * 用 `bytesPerPixel` 去对齐会让 `rgb10a2unorm` 的 `UNPACK_ROW_LENGTH` 算错）。
 */
export function glTypeElementBytes(type: number): number {
  const bytes = GL_TYPE_ELEMENT_BYTES.get(type);
  if (bytes === undefined) {
    throw new ValidationError(
      `[gpu-device-api] 未知的 GL 像素类型 0x${type.toString(16)}，无法计算上传布局。`,
    );
  }
  return bytes;
}

/** GL 像素类型对应的主机 TypedArray 名字（错误消息用）。 */
export function glTypeArrayName(type: number): string {
  return GL_TYPE_NAMES.get(type) ?? 'TypedArray';
}

/** 两个方向共用的校验部分（`bytesPerRow` 的整除性只对上传方向有约束）。 */
function resolveCommon(
  layout: { bytesPerRow?: number; rowsPerImage?: number } | undefined,
  size: Extent3D,
  info: GlTextureFormatInfo,
  operation: string,
  format: string,
  label: string | undefined,
): { bytesPerRow: number; rowsPerImage: number; bytesPerPixel: number; tightRowBytes: number; where: string } {
  const bytesPerPixel = info.bytesPerPixel;
  const tightRowBytes = size.width * bytesPerPixel;
  const bytesPerRow = layout?.bytesPerRow ?? tightRowBytes;
  const where = label ? ` (texture "${label}")` : '';

  if (!Number.isInteger(bytesPerRow) || bytesPerRow < tightRowBytes) {
    throw new ValidationError(
      `[gpu-device-api] ${operation}: bytesPerRow must be an integer >= ${tightRowBytes} ` +
        `(one row of ${size.width} "${format}" pixels at ${bytesPerPixel} bytes/pixel), ` +
        `got ${String(bytesPerRow)}.${where}`,
    );
  }

  const rowsPerImage = layout?.rowsPerImage ?? size.height;
  if (!Number.isInteger(rowsPerImage) || rowsPerImage < size.height) {
    throw new ValidationError(
      `[gpu-device-api] ${operation}: rowsPerImage (${String(rowsPerImage)}) must be >= the copy height ` +
        `(${size.height}).${where}`,
    );
  }
  if (!Number.isInteger(size.depthOrArrayLayers) || size.depthOrArrayLayers < 1) {
    throw new ValidationError(
      `[gpu-device-api] ${operation}: depthOrArrayLayers must be a positive integer, ` +
        `got ${String(size.depthOrArrayLayers)}.`,
    );
  }
  return { bytesPerRow, rowsPerImage, bytesPerPixel, tightRowBytes, where };
}

/**
 * 计算并校验一次 **buffer → texture** 拷贝的布局。
 *
 * @param layout 调用方给的 `TexelCopyBufferLayout` / `BufferCopyView`
 * @param size 拷贝范围
 * @param info 目标纹理格式的 GL 映射
 * @param operation 出错时的操作名（拼进错误消息，例如 `'copyBufferToTexture'`）
 * @param format 目标纹理格式名（只在错误消息里用到）
 * @param label 出错时指向哪一个 texture / buffer（可选）
 * @param availableBytes 源数据**实际**可用的字节数（相对 `offset`）；省略表示不检查
 */
export function resolveUploadLayout(
  layout: { bytesPerRow?: number; rowsPerImage?: number } | undefined,
  size: Extent3D,
  info: GlTextureFormatInfo,
  operation: string,
  format: string,
  label: string | undefined,
  availableBytes?: number,
): CopyLayout {
  const { bytesPerRow, rowsPerImage, bytesPerPixel, tightRowBytes, where } = resolveCommon(
    layout,
    size,
    info,
    operation,
    format,
    label,
  );

  /*
   * `UNPACK_ROW_LENGTH` 的单位是**像素**，所以行距必须是 `bytesPerPixel` 的整数倍才能用
   * 「一次 `texSubImage*` + 行距」表达。不是整数倍时退回**逐行上传**：每行都是一个独立、
   * 起点在行首的紧密子区间，GL 侧每次只看到一个「宽 width、行距紧凑」的矩形。
   */
  const perRowUpload = bytesPerRow % bytesPerPixel !== 0;
  /*
   * 第 k 层第 j 行在源数据里的起点。逐行上传时每层、每行各一个矩形；
   * 一次上传时 GL 用 `UNPACK_SKIP_IMAGES=k` / `UNPACK_IMAGE_HEIGHT=rowsPerImage` +
   * 行距 `UNPACK_ROW_LENGTH` 自己算，于是**层尾的填充也会被「读到」** —— 所以字节数必须按
   * 「每一层都占满 rowsPerImage 行」算。这是比 WebGPU 更严格的一侧
   * （WebGPU 只要求覆盖到最后一个像素，层尾填充可缺省），按 WebGPU 的公式算出来的 buffer
   * 一定够（`rowsPerImage >= height`），反之则不一定。
   */
  const requiredBytes = perRowUpload
    ? // 逐行上传时只有「真的被上传的那些行」需要存在（行间填充不需要）。
      (rowsPerImage * (size.depthOrArrayLayers - 1) + size.height - 1) * bytesPerRow + tightRowBytes
    : bytesPerRow * rowsPerImage * size.depthOrArrayLayers;

  if (availableBytes !== undefined && availableBytes < requiredBytes) {
    throw new ValidationError(
      `[gpu-device-api] ${operation}: the source data is too small for ${size.width}x${size.height}` +
        `x${size.depthOrArrayLayers} pixels with bytesPerRow=${bytesPerRow} and ` +
        `rowsPerImage=${rowsPerImage}: the last pixel ends at byte ${requiredBytes}, but only ` +
        `${availableBytes} bytes are available.${where}` +
        (perRowUpload
          ? ''
          : ' Note that WebGL2 uploads the whole image stack in one call, so the buffer must also ' +
            'cover the gaps between images (see TexelCopyBufferLayout.rowsPerImage).'),
    );
  }

  return {
    bytesPerRow,
    rowsPerImage,
    bytesPerPixel,
    requiredBytes,
    // 紧密布局时保持 GL 的默认值 0：这条路径不下发任何 pixelStorei。
    unpackRowLength: bytesPerRow === tightRowBytes || perRowUpload ? 0 : bytesPerRow / bytesPerPixel,
    unpackImageHeight: rowsPerImage === size.height ? 0 : rowsPerImage,
    perRowUpload,
  };
}

/**
 * 计算并校验一次 **texture → buffer** 拷贝的布局。
 *
 * 与上传方向的差别只有一处：`gl.readPixels` 永远按**紧凑**行距写进主机内存
 * （调用方把 `PACK_ALIGNMENT` 设成 1），行距的重排在 JS 里做，所以
 * `bytesPerRow` **不需要**是 `bytesPerPixel` 的整数倍 —— 它只是「每行往目标 buffer 的
 * 哪个偏移写」的问题。
 */
export function resolveReadbackLayout(
  layout: { bytesPerRow?: number; rowsPerImage?: number } | undefined,
  size: Extent3D,
  info: GlTextureFormatInfo,
  operation: string,
  format: string,
  label: string | undefined,
): CopyLayout {
  const { bytesPerRow, rowsPerImage, bytesPerPixel } = resolveCommon(
    layout,
    size,
    info,
    operation,
    format,
    label,
  );

  /*
   * 只要求覆盖到「最后一个像素」为止：读回是**逐层**做的（GL 的 readPixels 没有层的概念），
   * 所以层尾的填充不需要存在 —— 与 WebGPU 的公式一致。
   */
  const requiredBytes = bytesPerRow * (rowsPerImage * (size.depthOrArrayLayers - 1) + size.height);

  return {
    bytesPerRow,
    rowsPerImage,
    bytesPerPixel,
    requiredBytes,
    unpackRowLength: 0,
    unpackImageHeight: rowsPerImage === size.height ? 0 : rowsPerImage,
    perRowUpload: false,
  };
}

/**
 * 校验调用方给的 `TypedArray` 是否就是该格式要求的类型，并返回**按 GL 类型解释的视图**。
 *
 * 之所以需要它：`gl.texSubImage3D` 的 `pixels` 参数可以是任意 `ArrayBufferView`，
 * GL 只按 `type` 去解释内存 —— 传错类型不会报错，只会把字节当成别的数值类型读
 * （例如 `rgba16float` 传 `Float32Array` 时每像素被读成 2 个 half）。
 *
 * `assertUploadDataType`（`glFormatMap.ts`）只比较 `constructor.name`，这里在它的基础上
 * 额外处理 `byteOffset` 不满足元素对齐的情形 —— 那种情况下 `new Uint32Array(buffer, offset)`
 * 会直接抛 `RangeError`，错误信息完全看不出是「行距算错了」还是「视图构造错了」。
 */
export function toUploadElementView(
  format: string,
  info: GlTextureFormatInfo,
  data: ArrayBufferView,
  operation: string,
  scratch: ArrayBuffer | null,
): ArrayBufferView {
  const elementBytes = glTypeElementBytes(info.type);
  const expected = glTypeArrayName(info.type);
  const view = data as ArrayBufferView & { buffer: ArrayBufferLike; byteOffset: number; byteLength: number };

  if (view.byteOffset % elementBytes === 0) {
    // 已经是合法视图：直接按 GL 类型重新解释（`byteLength` 不整除时 GL 会忽略尾部残余字节）。
    const usable = view.byteLength - (view.byteLength % elementBytes);
    return createTypedArray(info.type, view.buffer as ArrayBuffer, view.byteOffset, usable);
  }

  /*
   * 到达这里说明视图的起点不在元素边界上（例如 `Uint8Array` 的 `subarray(2, ...)`）。
   * 先把内容搬到一块新的、按元素对齐的内存里 —— 只有这一种情形需要拷贝，
   * 正常的 `Uint8Array(...)` 全程零拷贝。
   */
  if (!scratch || scratch.byteLength < view.byteLength) {
    throw new ValidationError(
      `[gpu-device-api] ${operation}: the pixel data starts at byte offset ${view.byteOffset} of its ` +
        `ArrayBuffer, which is not a multiple of ${elementBytes} (the element size of "${expected}" ` +
        `required by format "${format}"). Pass a view whose byteOffset is ${elementBytes}-aligned, ` +
        'or hand in a plain ArrayBufferView of the right length.',
    );
  }
  const raw = new Uint8Array(scratch, 0, view.byteLength);
  raw.set(new Uint8Array(view.buffer as ArrayBuffer, view.byteOffset, view.byteLength));
  const usable = view.byteLength - (view.byteLength % elementBytes);
  return createTypedArray(info.type, scratch, 0, usable);
}

/** 按 GL 像素类型造一个对应类型的视图（长度按**元素个数**算）。 */
export function createTypedArray(
  type: number,
  buffer: ArrayBuffer,
  byteOffset: number,
  byteLength: number,
): ArrayBufferView {
  switch (type) {
    case 0x1401: // UNSIGNED_BYTE
      return new Uint8Array(buffer, byteOffset, byteLength);
    case 0x1400: // BYTE
      return new Int8Array(buffer, byteOffset, byteLength);
    case 0x1403: // UNSIGNED_SHORT
    case 0x140b: // HALF_FLOAT
      return new Uint16Array(buffer, byteOffset, byteLength / 2);
    case 0x1402: // SHORT
      return new Int16Array(buffer, byteOffset, byteLength / 2);
    case 0x1405: // UNSIGNED_INT
    case 0x8368: // UNSIGNED_INT_2_10_10_10_REV
    case 0x84fa: // UNSIGNED_INT_24_8
      return new Uint32Array(buffer, byteOffset, byteLength / 4);
    case 0x1404: // INT
      return new Int32Array(buffer, byteOffset, byteLength / 4);
    case 0x1406: // FLOAT
      return new Float32Array(buffer, byteOffset, byteLength / 4);
    default:
      throw new ValidationError(
        `[gpu-device-api] 未知的 GL 像素类型 0x${type.toString(16)}，无法构造上传视图。`,
      );
  }
}

/**
 * 把一段已经躺在主机内存里的数据上传进纹理。
 *
 * 三条路径（`CommandEncoder.copyBufferToTexture`、`Queue.copyBufferToTexture`、
 * `Queue.writeTexture`）共用它，于是「下发哪些 `UNPACK_*`、用哪个 `texSubImage*`」只有一份实现。
 *
 * ## 两种上传形态
 *
 * - **一次上传**（绝大多数情况）：`UNPACK_ROW_LENGTH = bytesPerRow / bytesPerPixel`、
 *   `UNPACK_IMAGE_HEIGHT = rowsPerImage`，`texSubImage3D` 一次吃掉整叠 image。
 *   紧密布局时这两个参数都保持 GL 的默认值 0（**一次 `pixelStorei` 都不下发**），
 *   于是紧密路径的 GL 调用序列与改动前逐条相同。
 * - **逐行上传**：`bytesPerRow` 不是 `bytesPerPixel` 的整数倍时，`UNPACK_ROW_LENGTH`（单位是
 *   像素）根本表达不了它 —— 退回每行一个矩形，每次给一个「宽 width、行距紧凑」的子视图。
 *
 * @param scratchProvider 只在需要「搬家」时才用到的惰性暂存区（见 {@link toUploadElementView}）
 */
export function uploadTextureData(
  gl: WebGL2RenderingContext,
  target: number,
  native: WebGLTexture,
  mipLevel: number,
  origin: { x: number; y: number; z: number },
  size: Extent3D,
  info: GlTextureFormatInfo,
  format: string,
  data: Uint8Array,
  layout: CopyLayout,
  scratchProvider: () => ArrayBuffer,
  /** 出错消息里的操作名（`copyBufferToTexture` / `writeTexture`）。 */
  operation = 'writeTexture',
): void {
  const layered = target === gl.TEXTURE_3D || target === gl.TEXTURE_2D_ARRAY;
  const view = (byteOffset: number, byteLength: number): ArrayBufferView =>
    toUploadElementView(
      format,
      info,
      new Uint8Array(data.buffer, data.byteOffset + byteOffset, byteLength),
      operation,
      scratchProvider(),
    );

  gl.bindTexture(target, native);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  if (layout.unpackRowLength !== 0) gl.pixelStorei(GL_UNPACK_ROW_LENGTH, layout.unpackRowLength);
  if (layout.unpackImageHeight !== 0) gl.pixelStorei(GL_UNPACK_IMAGE_HEIGHT, layout.unpackImageHeight);
  try {
    if (layout.perRowUpload) {
      const tightRowBytes = size.width * layout.bytesPerPixel;
      for (let layer = 0; layer < size.depthOrArrayLayers; layer += 1) {
        for (let row = 0; row < size.height; row += 1) {
          const at = (layer * layout.rowsPerImage + row) * layout.bytesPerRow;
          const source = view(at, tightRowBytes);
          if (layered) {
            gl.texSubImage3D(
              target,
              mipLevel,
              origin.x,
              origin.y,
              origin.z + layer,
              size.width,
              1,
              1,
              info.format,
              info.type,
              source,
            );
          } else {
            gl.texSubImage2D(
              target,
              mipLevel,
              origin.x,
              origin.y + row,
              size.width,
              1,
              info.format,
              info.type,
              source,
            );
          }
        }
      }
    } else if (layered) {
      gl.texSubImage3D(
        target,
        mipLevel,
        origin.x,
        origin.y,
        origin.z,
        size.width,
        size.height,
        size.depthOrArrayLayers,
        info.format,
        info.type,
        view(0, data.byteLength),
      );
    } else {
      gl.texSubImage2D(
        target,
        mipLevel,
        origin.x,
        origin.y,
        size.width,
        size.height,
        info.format,
        info.type,
        view(0, data.byteLength),
      );
    }
  } finally {
    // 只在真的改过的时候还原：这两项的 GL 默认值就是 0，紧密布局下多发一次
    // 「写回默认值」纯属白付的 JS→GL 调用。
    if (layout.unpackRowLength !== 0) gl.pixelStorei(GL_UNPACK_ROW_LENGTH, 0);
    if (layout.unpackImageHeight !== 0) gl.pixelStorei(GL_UNPACK_IMAGE_HEIGHT, 0);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
  }
}

/** `UNPACK_ROW_LENGTH` 的 GL 枚举（写死数值，避免依赖上下文实例）。 */
const GL_UNPACK_ROW_LENGTH = 0x0cf2;
/** `UNPACK_IMAGE_HEIGHT` 的 GL 枚举。 */
const GL_UNPACK_IMAGE_HEIGHT = 0x806e;

/**
 * 把一段紧密排布的数据重排成「按请求行距」的样子（`copyTextureToBuffer` 用）。
 *
 * `gl.readPixels` 只能按**紧密**行距写进主机内存（我们把 `PACK_ALIGNMENT` 设成 1），
 * 而 WebGPU 的 `bytesPerRow` 允许更大的行距，所以必须自己按行搬到目标位置。
 * 行间填充保持 `0`（`new Uint8Array` 的初值）—— 与改动前的行为一致，给出确定的值
 * 比留下上一次读回的残留更好排查。
 *
 * @param tight 紧密的源数据
 * @param out 目标缓冲（长度至少 `offset + bytesPerRow * height`），就地写入
 * @param offset 目标缓冲里这次写回的起点
 */
export function repackRows(
  tight: Uint8Array,
  out: Uint8Array,
  offset: number,
  tightRowBytes: number,
  bytesPerRow: number,
  height: number,
): void {
  if (bytesPerRow === tightRowBytes) {
    out.set(tight, offset);
    return;
  }
  for (let row = 0; row < height; row += 1) {
    out.set(tight.subarray(row * tightRowBytes, (row + 1) * tightRowBytes), offset + row * bytesPerRow);
  }
}
