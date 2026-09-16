/**
 * `setScissorRect` / `setViewport` 的 **Y 原点换算**：把「左上原点」的矩形换算成当前附件真正
 * 接受的原生坐标。
 *
 * ## 为什么需要这个函数
 *
 * `gl.scissor` / `gl.viewport` 的原点在**左下**，`setScissorRect` / `setViewport`（WebGPU）的
 * 原点在**左上**，core 层如实透传、不做任何转换（见 `RenderPassEncoder` 上的说明）。于是同一个
 * 矩形在两个后端落在**相反**的一半上，这是最容易踩的跨后端差异。
 *
 * 但真正让它难写对的不是「两个后端不同」，而是**同一个后端内部还不自洽**。以下读数全部来自
 * 无头 Chrome 实跑（`examples/scissor-origin.html` + `scripts/verify-scissor-origin.mjs`，
 * `--use-angle=swiftshader` / `--enable-unsafe-webgpu`；画面基准由真实合成截图锚定：
 * canvas 上半红、下半绿），是加了 helper 之后仍然成立的现状：
 *
 * | 通道 | 不转换 `(0,0,W,H/2)` 保留的图像半区 | 该传的 `imageOrigin` |
 * | --- | --- | --- |
 * | WebGL2 canvas | 图像**下半** | `'bottomLeft'`（要翻） |
 * | WebGL2 离屏，**没翻**投影 | 图像**下半** | `'bottomLeft'`（要翻） |
 * | WebGL2 离屏，**翻了**投影（gfx 默认） | 图像**上半** | `'topLeft'`（恒等） |
 * | WebGPU（任意附件） | 图像**上半** | `'topLeft'`（恒等） |
 *
 * 第二、三行是关键：`gfx` 的 `Renderer` 默认给「渲染进纹理」的通道把相机投影在裁剪空间 Y 取反
 * （`mat4.flipClipY`），于是**同一条 WebGL2 离屏路径**，翻不翻投影会给出两种相反的图像朝向。
 * 所以
 *
 * - **不要从某一条渲染路径反推规则**：「WebGL2 就要翻」在翻过投影的离屏通道上是错的，
 *   「不转换就对了」在 canvas 通道和没翻投影的离屏通道上也是错的；
 * - `imageOrigin` 描述的是**这个附件**（第 0 行对应图像的哪一端），不是后端，甚至不是通道；
 * - **两个后端的 `imageOrigin` 取值不是同一套参照系**：`rowOrder` 如实上报
 *   （WebGL2 离屏 = `'bottomUp'`、WebGPU = `'topLeft'`），同一个 `imageOrigin` 值在
 *   朝向相反的两个附件上会保留**相反**的图像半区。实测：本函数的 `'bottomLeft'` 在
 *   WebGL2 离屏上保留图像**下半**、在 WebGPU 离屏上保留图像**上半**。调用方必须按
 *   **该附件**的朝向传值；同一条代码不可能靠一个常量在两个后端上同时正确。
 *
 * ## 换算规则
 *
 * - `imageOrigin === 'topLeft'`（附件第 0 行就是图像顶端）：恒等，`y' = y`；
 * - `imageOrigin === 'bottomLeft'`（附件第 0 行是图像底端）：`y' = attachmentHeight - (y + height)`。
 *
 * 可执行证据见 `examples/scissor-origin.html`（两个后端各画一次并读回像素）；
 * 回填结论见 `docs/backend-limits.md` 的 scissor / viewport 条目。
 */

/** 附件里第 0 行对应**图像**的哪一端；`setScissorRect` / `setViewport` 的 Y 要不要翻转由它决定。 */
export type ScissorImageOrigin =
  /** 第 0 行是图像**顶端**（WebGPU 的任意附件；WebGL2 上投影被翻过的纹理附件）。无需翻转。 */
  | 'topLeft'
  /** 第 0 行是图像**底端**（WebGL2 的 canvas 默认帧缓冲；WebGL2 上没翻投影的纹理附件）。需要翻转。 */
  | 'bottomLeft';

/** 一个矩形。`x` / `y` 是左上角，`width` / `height` 是尺寸，单位都是**附件像素**。 */
export interface NativeRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * 把**左上原点**的矩形换算成 `attachmentHeight` 那个附件的原生坐标。
 *
 * - 传入的矩形一律按「左上原点、y 向下」的**图像空间**给出（这正是 `imageOrigin === 'topLeft'`
 *   那种附件的坐标系，也是 WebGPU 的约定）；
 * - `imageOrigin` 描述该附件的第 0 行对应图像的哪一端，用来决定是否需要翻转；
 * - 返回值的 `y` 是该附件**原生**坐标里的 `y`，可以直接喂给 `setScissorRect` / `setViewport` /
 *   `gl.scissor` / `gl.viewport`；也就是说返回值**不在**入参那个坐标系里（除非 `'topLeft'`）。
 *
 * 边界性质（单测钉死）：`y = 0` 时 `y' = attachmentHeight - height`；`y + height = attachmentHeight`
 * 时 `y' = 0`；`height = 1` 时 `y' = attachmentHeight - y - 1`。函数**不做**任何尺寸校验，
 * 也不会把结果夹到附件范围内 —— 负数或越界的矩形原样返回，由后端按各自的规则处理。
 *
 * @param rect 左上原点的矩形（图像空间）。
 * @param attachmentHeight **附件**的高度，不是矩形的高度。WebGL2 的 canvas 通道就传 canvas 的
 *   像素高度，离屏通道传该 render target 的高度；两者都不是 `rect.height`。
 * @param imageOrigin 该附件的图像行序（见 {@link ScissorImageOrigin}）。
 * @returns 新对象：附件原生坐标下的同一个矩形。**不修改入参。**
 *
 * ```ts
 * // 画面上半：不论在哪个后端、走哪条路径，都写这一个矩形。
 * const half = { x: 0, y: 0, width: target.width, height: Math.floor(target.height / 2) };
 * // canvas 通道与「没翻投影」的离屏通道第 0 行是图像底端；翻过投影的离屏通道与 WebGPU 是顶端。
 * const imageOrigin = isCanvasPass || !projectionFlipped ? 'bottomLeft' : 'topLeft';
 * const rect = toNativeScissorRect(half, target.height, imageOrigin);
 * pass.setScissorRect(rect.x, rect.y, rect.width, rect.height);
 * ```
 */
export function toNativeScissorRect(
  rect: NativeRect,
  attachmentHeight: number,
  imageOrigin: ScissorImageOrigin,
): NativeRect {
  return {
    x: rect.x,
    y: flipViewportY(rect.y, rect.height, attachmentHeight, imageOrigin),
    width: rect.width,
    height: rect.height,
  };
}

/**
 * 与 {@link toNativeScissorRect} 完全相同的换算，只是名字里点明它同样适用于 `setViewport`。
 *
 * 为什么两者共用一条公式：viewport 与 scissor rect 在**两个后端里都是同一套窗口坐标**
 * （GL 的 `gl.viewport` / `gl.scissor`，WebGPU 的 `setViewport` / `setScissorRect`），原点约定
 * 一模一样。要改其中一个而不改另一个，没有任何正当理由 —— 而且若把全屏 viewport 只在一个后端
 * 翻 Y，就等于只在那个后端把整幅图翻过来，正好是这条差异最糟糕的用法。
 */
export function toNativeViewportRect(
  rect: NativeRect,
  attachmentHeight: number,
  imageOrigin: ScissorImageOrigin,
): NativeRect {
  return toNativeScissorRect(rect, attachmentHeight, imageOrigin);
}

/** Y 的换算本体：`'bottomLeft'` 时按 `y' = attachmentHeight - (y + height)` 翻转。 */
function flipViewportY(y: number, height: number, attachmentHeight: number, imageOrigin: ScissorImageOrigin): number {
  return imageOrigin === 'bottomLeft' ? attachmentHeight - (y + height) : y;
}
