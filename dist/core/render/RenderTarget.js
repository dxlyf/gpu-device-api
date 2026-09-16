/** 离屏 render target：一个或多个 color attachment，外加可选的 depth/stencil attachment。 */
/**
 * 渲染目标的**原生行序**：渲染通道写进附件时，画面（裁剪空间的 +Y 方向）落在纹素的哪一端。
 *
 * 本库的纹理约定是「纹素 (0, 0) 在左上角」（见 `Texture.ts`），但两个后端**渲染进附件**时的
 * 原生行序并不一样，这一层不做任何自动转换，只如实暴露：
 *
 * - `'topLeft'`：纹素第 0 行就是画面**顶端**（WebGPU）—— 与上面的约定天然一致；
 * - `'bottomUp'`：纹素第 0 行是画面**底端**（WebGL2 的窗口原点在左下，附着到 FBO 上的纹理
 *   因此自下而上存储）—— 与上面的约定相反。
 *
 * 后果是「先渲染到纹理、再把这张纹理采样上屏」在两个后端会得到上下颠倒的画面，而
 * `CommandEncoder.copyTextureToBuffer` 与 `Queue.writeTexture` 都忠实按纹素行序工作
 * —— 于是读回来的行序也跟着相反。core 层**不代劳**，要统一请二选一：
 *
 * 1. 把相机投影矩阵在裁剪空间做 Y 取反（`mat4.flipClipY`，等价于 `gl_Position.y *= -1`），
 *    渲染结果就直接落在与 WebGPU 相同的行序上 —— **注意它同时会反转三角绕序**，
 *    开了背面剔除时要把 `frontFace` 一起换过来；
 * 2. 保留原生行序，在**读回**之后自己按 `target.rowOrder === 'bottomUp'` 反一次行序。
 *
 * 便捷层（`src/gfx`）的 `Renderer` 会在「渲染进纹理」的通道上自动用第 1 条，所以用 gfx 绘制时
 * 两个后端无感一致（见 `gfx` 的 `RendererOptions.rowOrder`）。
 */
export const RowOrder = {
    TopLeft: 'topLeft',
    BottomUp: 'bottomUp',
};
//# sourceMappingURL=RenderTarget.js.map