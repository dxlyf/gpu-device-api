/**
 * GPU texture 资源。对应 WebGPU 的 `GPUTexture`。
 *
 * **纹理坐标与行序约定（两个后端必须一致，这是「换后端就能画」的前提）**
 *
 * - 纹理坐标 `v = 0` 对应纹素第 0 行，`v` 增大就是纹素行号增大；纹素 (0, 0) 在**左上角**。
 *   也就是说本库站在 **WebGPU 那一边**（`v = 0` 是图像顶部），而不是 GL 教科书里的「左下」。
 * - `Queue.writeTexture` / `CommandEncoder.copyBufferToTexture` **不翻转**：主机数据的第 0 行
 *   写进纹素第 0 行。WebGL2 的实现是 `texSubImage2D`（只设置 `UNPACK_ALIGNMENT` / `UNPACK_ROW_LENGTH`，
 *   从不设置 `UNPACK_FLIP_Y_WEBGL`），WebGPU 是原生 `writeTexture`，两边天然一致。
 * - `Queue.copyExternalImageToTexture(..., flipY)` 的 `flipY` 在两个后端语义相同：
 *   WebGL2 设 `UNPACK_FLIP_Y_WEBGL`，WebGPU 传原生 `flipY` 选项，默认都是 `false`。
 * - `CommandEncoder.copyTextureToBuffer` 的缓冲区第 0 行 = 纹素行 `origin.y`，两个后端一致
 *   （WebGL2 走 `gl.readPixels`，它就从 `origin.y` 起按纹素行序逐行读出，实现里不做任何翻转）。
 *
 * 这套约定对**上传过的**纹理已经两个后端一致（`examples/core-texture-mipmap.ts` 会把两级 mip
 * 的真实字节在两个后端上读回并逐纹素比对），对 `copyTextureToBuffer` 也一样。
 *
 * **唯一不遵循它的地方是「渲染进纹理」**：WebGL2 的渲染目标自下而上存储（GL 的窗口原点在左下），
 * WebGPU 自上而下 —— 同一个渲染结果的纹素行序在两个后端相反，读回与采样都会上下颠倒。
 *
 * core 层**如实暴露、不代劳**：`RenderTarget.rowOrder` 给出该目标的后端原生行序
 * （WebGPU = `'topLeft'`、WebGL2 = `'bottomUp'`），需要统一时由调用方二选一：
 *
 * - 用 `mat4.flipClipY`（`src/utils/math/mat4.ts`）把投影矩阵在裁剪空间做一次 Y 取反（等价于
 *   `gl_Position.y *= -1`，**并且会反转三角绕序**，开背面剔除时要一起换 `frontFace`）
 *   —— 这样渲染结果直接符合上面的约定；
 * - 或者保留原生行序，读回后按 `rowOrder` 自己反一次行序。
 *
 * 便捷层 `gfx` 的 `Renderer` 默认自动做第一种（只对**渲染进纹理**的通道、只对 WebGL2、
 * 只对使用库提供投影 uniform 的材质生效），细节见 `docs/backend-limits.md` 第五节。
 */
import { TextureUsage } from '../enums/TextureUsage.js';
import { ValidationError } from '../errors/ValidationError.js';
export const TextureDimension = {
    D1: '1d',
    D2: '2d',
    D3: '3d',
};
/** 归一化可接受的尺寸写法。 */
export function resolveTextureSize(size) {
    if (typeof size === 'number') {
        return { width: size, height: size, depthOrArrayLayers: 1 };
    }
    return {
        width: size.width,
        height: size.height ?? 1,
        depthOrArrayLayers: size.depthOrArrayLayers ?? 1,
    };
}
/**
 * 覆盖最大维度所需的 mip 层级数 —— WebGPU 规范里的 `maximum mipLevel count`。
 *
 * 规范先按 `dimension` 取「最大维度」`m`，再算 `floor(log2(m)) + 1`：`"2d"` 只看
 * `max(width, height)`，`"3d"` 看 `max(width, height, depthOrArrayLayers)`，`"1d"` 恒为 1。
 *
 * ⚠️ 本函数**没有** `dimension` 参数，一律取 `max(width, height, depthOrArrayLayers)`：
 * 这对 `3d` 正确，但对**带数组层的 `2d`** 会**高估**（数组层数不参与 mip 层数上限），
 * 对 `1d` 也会高估 —— 需要精确上限的调用方请自己按 `1 + floor(log2(max(width, height)))`
 * 计算。当前唯一影响是 WebGPU 创建纹理时的上限校验偏松：超出规范上限的 `mipLevelCount`
 * 最终仍会被原生校验拒绝，不会静默产出一张尺寸不对的纹理。
 */
export function fullMipLevelCount(size) {
    const extent = resolveTextureSize(size);
    return Math.floor(Math.log2(Math.max(extent.width, extent.height, extent.depthOrArrayLayers))) + 1;
}
/**
 * 第 `level` 级 mip 的尺寸。
 *
 * 每一维都**独立**减半并且下限为 1 —— 这两点都是规范要求，也是非 2 的幂 / 非正方形纹理
 * 最容易写错的地方：
 *
 * - `64x64` 的第 6 级是 `1x1`（第 6 级之后就不再有更小的级别，所以 64x64 一共 7 级）；
 * - `8x2` 的第 1 级是 `4x1`（高度先到 1，之后一直保持 1），一共 4 级；
 * - `60x36` 的第 1 级是 `30x18`，第 5 级是 `1x1`，一共 6 级。
 *
 * **`depthOrArrayLayers` 参不参与减半由 `dimension` 决定**（WebGPU 规范
 * `Logical miplevel-specific texture extent`，`2d` 与 `3d` 是两个不同的分支）：
 *
 * - `'2d'`（含本库的 2d-array，即 `depthOrArrayLayers > 1` 的 `'2d'` texture）：
 *   该字段是**数组层数**，每层是彼此独立的 subresource，所以**不随级别变化**；
 * - `'3d'`：该字段是**深度**，按 `max(1, depth >> level)` **逐级减半**。
 *
 * 这两种语义在描述符里**共用同一个字段**，只能靠 `dimension` 区分，
 * 所以**3D 纹理的调用方必须显式传 `'3d'`**；缺省值 `'2d'` 与 WebGPU 自身
 * `GPUTextureDescriptor.dimension` 的缺省一致（不填就是 `"2d"`），不传即「按 2d 解释」。
 *
 * `level` 与 `dimension` 都做校验，非法值抛 {@link ValidationError}（不做静默兜底）。
 */
export function mipLevelExtent(size, level, dimension = TextureDimension.D2) {
    if (!Number.isInteger(level) || level < 0) {
        throw new ValidationError(`[gpu-device-api] mipLevelExtent: level must be a non-negative integer, got ${String(level)}.`);
    }
    if (dimension !== TextureDimension.D1 &&
        dimension !== TextureDimension.D2 &&
        dimension !== TextureDimension.D3) {
        // JS 调用方（或绕过类型的人）可能传进来本库没有的 dimension 值（例如 `"2d-array"` ——
        // 那是 `TextureViewDimension` 的值，texture 的 2d-array 在本库里是 `'2d'` + 层数 > 1）。
        // 静默按 `'2d'` 处理会把 3D 的 depth 算错，所以这里直接报错。
        throw new ValidationError(`[gpu-device-api] mipLevelExtent: dimension must be "1d", "2d" or "3d", got ${String(dimension)}.`);
    }
    const extent = resolveTextureSize(size);
    const shift = (value) => Math.max(1, Math.trunc(value / 2 ** level));
    return {
        width: shift(extent.width),
        height: shift(extent.height),
        // 只有 3d 的 depth 减半；2d / 2d-array 的层数在每一级都保持不变。
        depthOrArrayLayers: dimension === TextureDimension.D3 ? shift(extent.depthOrArrayLayers) : extent.depthOrArrayLayers,
    };
}
/** 只上传一次并被采样的 texture 的默认 usage。 */
export function defaultTextureUsage(extra = 0) {
    return TextureUsage.CopyDst | TextureUsage.TextureBinding | extra;
}
//# sourceMappingURL=Texture.js.map