# 后端能力边界与不可恢复的情形

这份文档只记录**容易被误解**的地方：哪些能力在某个后端上不存在、不可恢复，以及本库在这些情形下
到底做了什么（明确报错 / 如实上报 / 静默降级）。凡是「做不到」的都写清楚做不到的原因，
不做「看起来完整」的承诺。

## 一、设备丢失（device lost）

### 能做什么

| 能力 | WebGPU | WebGL2 |
| --- | --- | --- |
| 同步查询是否已丢失 | `device.lostInfo`（原因 + 消息）、`device.usable` | 同 |
| 等待丢失（异步） | `await device.lost` | 同 |
| 收到通知 | `device.onError(cb)`（丢失会计入） | `device.onError(cb)` + `device.onContextRestored(cb)` |
| 后续提交明确报错 | `queue.submit()` / `writeBuffer()` / `copy*()` / 所有 `create*()` 抛 `DeviceLostError` | 所有 `create*()` / 读回入口抛 `DeviceLostError` |
| 主动 `dispose()` | `lostInfo.reason === 'destroyed'` | 同 |

`DeviceLostError` 的消息一律以 `[gpu-device-api] ` 开头，并带上丢失原因与原始 message，例如：

```
[gpu-device-api] Device.Queue.submit: device "webgpu-device" was lost (unknown): GPU device removed
```

为什么必须由本库主动抛错：WebGPU 规范规定，设备丢失后 `GPUDevice` 上的调用会被**静默丢弃** ——
命令不执行、也不报错。表现就是「每帧都在提交、画面永远不动、一行错误都没有」，
这是最难排查的一类问题，所以提交入口必须自己拦下来。

### 不能做什么（重要）

**完整恢复（自动重建全部资源）在本抽象层里做不到**，两个后端都一样。原因不同：

- **WebGPU**：`GPUDevice` 丢失后永久失效，没有任何原生手段把它救回来；而且 `GPUDevice` 上
  没有回到 `GPUAdapter` 的引用，本层也无法替你 `requestDevice()`。
- **WebGL2**：`webglcontextrestored` 之后，canvas 上的 GL context 本身又能用了，但
  **它创建过的所有对象都已经不存在**。我们的资源包装对象里只有已经作废的句柄，
  没有可以重放的 descriptor（例如 texture 的原始上传数据早已被 GC），因此无法重建。

所以 `device.usable` **不会**在恢复后变回 `true`。

### 正确的恢复流程

```ts
const device = await createDevice({ canvas, backend: 'auto' });

device.onError((error) => {
  if (error instanceof DeviceLostError) {
    // 1. 丢弃旧设备（它会释放仍在追踪的资源、摘掉 canvas 上的监听器）
    device.dispose();
    // 2. 重新创建设备（WebGPU 需要重新 requestAdapter/requestDevice）
    // 3. 重建全部资源，从头开始渲染
  }
});
```

WebGL2 还可以用 `device.onContextRestored()` 知道「canvas 又能用了」这个时刻，
但**不要**复用旧设备上的任何资源对象。

真实浏览器里的验证见 `examples/device-lost.html`（`?backend=webgl2|webgpu`）：
WebGL2 用 `WEBGL_lose_context` 真的丢一次上下文再恢复，WebGPU 用 `GPUDevice.destroy()`
触发真实丢失，两边都会检查「检测 → 明确报错 → 重新创建设备后可用」这条完整链路。

## 二、离屏多重采样（MSAA）

- **WebGPU**：`createRenderTarget({ sampleCount })` 走 WebGPU 原生路径 —— 每路颜色附件建一张
  多重采样纹理作为 attachment，另建一张单采样纹理作为 `resolveTarget`；通道结束时由驱动 resolve。
  `target.colors[i]` 给的是**单采样那张**（可采样、可读回）。
- **WebGL2**：GL 的多重采样**只能渲染到 renderbuffer**，不能直接渲染到纹理。本库的做法是给
  渲染目标建两个 framebuffer：
  - draw FBO：附件是 `renderbufferStorageMultisample` 分配的 renderbuffer，绘制发生在这里；
  - resolve FBO：附件是普通单采样纹理（也就是 `target.colors[i]`）。

  渲染通道 `end()` 时用 `blitFramebuffer`（`NEAREST`）把 draw FBO 解析到 resolve FBO。
  这是 WebGL2 里唯一的多重采样 resolve 途径。

（一个常见的误解是「WebGL2 无法把多重采样离屏目标 resolve 成纹理」，所以只能放弃离屏 MSAA。
`blitFramebuffer` 就是为这件事存在的，本库早期版本的注释里也写错了这一点。）

### 采样数不被支持时

**明确报错，绝不静默降级成 1**。三道检查：

1. `sampleCount` 必须是正整数；
2. 不得超过 `MAX_SAMPLES`（`gl.getParameter`）；
3. 必须在该格式通过 `getInternalformatParameter(RENDERBUFFER, internalFormat, SAMPLES)`
   报告的可用集合里；
   最后还有 attach 之后的 `checkFramebufferStatus`（`FRAMEBUFFER_INCOMPLETE_MULTISAMPLE`）兜底。

WebGPU 侧由 `createRenderTarget` 的格式/采样数校验给出同样的效果。

几条容易踩的约束：

- 多重采样目标的 `usage` 里必须有 `TextureBinding` 才算「结果可以被采样」；
  WebGPU 会如实校验（缺了它就是「提交成功但整条 command buffer 无效」）。
- 想要把结果画到 canvas，需要用一次全屏拷贝（离屏纹理 → 默认帧缓冲）；
  这一趟最好是 1:1 且 `nearest`，否则统计到的中间色就分不清是 MSAA 还是滤波器产生的。
- 通过 `target.createPassDescriptor()` 拿到的附件列表同样能触发 MSAA：渲染通道会从附件反查到
  它的渲染目标（`Renderer` 走的就是这条路径）。把一个多重采样目标的附件与别的附件混用会**明确报错**，
  因为 renderbuffer 与纹理不能挂在同一个 FBO 上。

真实证据见 `examples/msaa-offscreen.html`（512×512、18 条旋转长条、全屏 1:1 最近邻贴图）
配合 `scripts/capture-screenshot.mjs` + `scripts/analyze-screenshot.mjs`：

| 采样数 | 后端 | 纯白像素 | 底色像素 | **中间色像素** | 前景不同颜色数 |
| --- | --- | --- | --- | --- | --- |
| 1 | WebGL2 | 96916 | 165228 | **0** | 1 |
| 4 | WebGL2 | 95290 | 163651 | **3203** | 4 |
| 1 | WebGPU | 96910 | 165234 | **0** | 1 |
| 4 | WebGPU | 95291 | 163650 | **3203** | 4 |

（共 262144 像素 = 512²；中间色像素数 = 「非底色」+「非纯白」− 总像素，两条容差带互不相交。）

> 行序修复（见第五节）之后 WebGL2 那一趟是在**镜像过的投影**下渲染的，斜边落到的像素栅格跟着镜像，
> 中间色计数因此挪了 0.01%：WebGL2 实测变成纯白 95301 / 底色 163673 / **中间色 3170**，
> WebGPU 与上表逐字节相同（95291 / 163650 / **3203**）。中间色的三档数值与两后端的一致性不受影响。

4 倍多重采样下出现的中间色**恰好是 3 种**（= sampleCount − 1），且数值正好对应 25% / 50% / 75%
的覆盖率：白色 255 覆盖到底色 (20,26,38) 上分别是 79 / 138 / 197 —— 这正是教科书式的 4x MSAA 行为，
两个后端给出的数字几乎一致（WebGL2 138,141,147 / 197,198,201 / 79,84,93，WebGPU 137,140,146 /
196,198,201 / 79,83,92），说明两条完全不同的实现路径（renderbuffer+blit 与多重采样纹理+resolveTarget）
产生的是同一件事。

## 三、compute（GPGPU）

**WebGL2 没有 compute shader**：它对应 GLES 3.0，而 compute shader / SSBO 是 GLES 3.1 的能力。
本库在 WebGL2 后端上：

- `device.createComputePipeline()` 抛 `ValidationError`；
- `encoder.beginComputePass()` 抛 `ValidationError`；
- `BufferUsage.Storage` / `Indirect` / `QueryResolve` 在 `createBuffer` 时就被拒绝。

错误消息里给出了替代方案：

1. 切到 WebGPU 后端（`createDevice({ backend: 'auto' })` 会优先选它）；
2. 在 WebGL2 上用「全屏三角形 + 浮点纹理」做 GPGPU —— 把数据编码进纹理，用片元着色器当 kernel，
   结果渲染到另一张纹理再读回。

可运行的数值证据见 `examples/compute.html`（WebGPU 上 `dst[i] = src[i] * src[i] + 1`，4096 个值
逐元素严格相等、校验和一致；WebGL2 上把上面两条错误原文抓出来）。

## 四、资源追踪与释放

设备会登记自己创建的所有资源，`device.dispose()` 时统一释放。**资源在自己的
`destroy()` / `dispose()` 里必须把自己从登记表里摘掉**（`device.untrack(resource)`），
否则「每帧 create/destroy」的用法（临时 buffer、纹理、bind group、render target、query set……）
会让登记表一直强引用已经释放的包装对象与原生句柄，直到 `device.dispose()` —— 那是实打实的泄漏。

诊断接口：`device.trackedResourceCount`（不属于 core 的 `Device` 接口，仅供诊断与测试）。
两个后端各有一个回归测试：`test/webgpu-resource-tracking.test.ts`、`test/webgl2-resource-tracking.test.ts`。

## 五、渲染目标的行序（分层方案 C：core 显式、gfx 自动）

本库的纹理约定站在 **WebGPU** 这一边：纹素 (0, 0) 在左上角，纹理坐标 `v = 0` 指向纹素第 0 行，
`queue.writeTexture` 把主机数据的第 0 行原样放进纹素第 0 行（两个后端都不翻转），
`copyExternalImageToTexture` 的 `flipY` 在两个后端语义相同。

**上传与读回**都已经对齐：WebGL2 的上传不设 `UNPACK_FLIP_Y_WEBGL`，读回走 `gl.readPixels`
且不反行序，缓冲区第 0 行同样是「纹素行 `origin.y`」——这一点由 `examples/core-texture-mipmap.ts`
在两后端之间逐纹素比对 mip 的真实字节佐证。

**唯一不遵循这条约定的是「渲染进纹理」**：GL 的窗口原点在左下角，附着到 FBO 上的纹理因此是
自下而上存储的，纹素第 0 行是画面**底端**；WebGPU 的附件纹素 (0, 0) 在左上角。这不是
`copyTextureToBuffer` 的错（两个后端都忠实按纹素行序拷贝），而是渲染目标的固有差别。

**上屏那一侧本来就是一致的**：真实合成截图（`scripts/capture-screenshot.mjs` +
`scripts/compare-screenshots.mjs`）证明同一画布两个后端的**原样一致率 100.00%**，翻转后只有
66.31% —— 所以下面的处理只针对「附件是纹理」的渲染通道，**画布默认帧缓冲永远不翻**。

### core 层：如实暴露，不自动转换

`RenderTarget.rowOrder` 给出该目标的**后端原生行序**：WebGPU 恒为 `'topLeft'`，
WebGL2 恒为 `'bottomUp'`。core 不做任何自动翻转 —— 它不掌握调用方的相机，翻不了，也不假装翻了。
想统一时调用方二选一：

1. **在渲染侧翻投影**：公开 helper `mat4.flipClipY(out, a)` 接收投影矩阵（或投影视图矩阵），
   返回在**裁剪空间** Y 取反的结果，等价于在着色器里写 `gl_Position.y *= -1`。
   ⚠️ 它同时**反转三角绕序**（逆时针变顺时针），开了背面剔除就必须把 `frontFace` 一起换过来。
   好处是渲染结果直接符合本库约定，后续的**采样与读回都不必再补偿**。
2. **在读回侧反行序**：保留原生行序，读回后按 `target.rowOrder === 'bottomUp'` 反一次行序。
   只对「读回」这一条路径有效；把渲染出来的纹理**当纹理采样**时仍然是上下颠倒的。

### gfx 层：自动，用户无感

`Renderer` 的 `rowOrder` 选项默认 `'unified'`：只要**当前通道的附件是纹理**（`FrameOptions.target`）
**且该目标的 `rowOrder` 不是 `'topLeft'`**，它就会

- 把相机投影在裁剪空间 Y 取反之后才写进 `projection` / `projectionView` uniform
  （相机自己的矩阵不被修改，所以同一帧里画进画布的部分照旧）；
- 在同一通道内把该材质的 `frontFace` 换到另一侧（`'ccw'` ↔ `'cw'`），
  这条管线**与原来那条共用同一份着色器**（WebGL2 的 program 缓存按源码命中，WebGPU 上根本不会
  走到这条路），所以「预热一个变体 ⇒ 之后零编译」的契约不受影响；
- 切回画布通道时把两者都恢复（画布通道用回没翻过的那条管线）。

`rowOrder: 'backend'` 可以关掉这条自动行为，如实保留后端原生行序。

### ⚠️ 这条自动翻转的能力边界（务必读）

**它只对使用库提供的投影 uniform（`projection` / `projectionView`）的材质有效** ——
因为翻转发生在「本层往这两个 uniform 里写的矩阵」上。

顶点着色器把位置写死（`gl_Position = vec4(常量)`，典型是全屏四边形、blit、后处理辅助）的材质
**不受影响**：那种写法里没有任何投影矩阵可以被外部替换，翻转不生效。处理办法是**在该材质的
着色器里自己对位置做同样的裁剪空间 Y 取反**（这也同样反转绕序，所以 `frontFace` 要一起换），
例如：

```glsl
gl_Position = vec4(quad.x, -quad.y, 0.0, 1.0);   // 只在渲染进纹理的通道上用
```

core 层用 `mat4.flipClipY` 是同一件事的矩阵写法（`examples/msaa-offscreen.ts` 是 core 侧的示范：
它把 helper 的结果写进自己的 `u.projection`，于是上屏那一趟两个后端可以共用同一个 uv 公式）。

`gfx` 自己生成/推荐的全部材质（`materials.lambert` / `phong` / `unlit` / `normalDebug` /
`flatLine` / `vertexColorLine`）用的都是 `u.projectionView * u.model * ...`，
**没有任何一条路径把位置写死**，所以 gfx 用户按文档写法画东西时不需要关心这条限制。

### 判据与回归

- `examples/rtt-orientation.html` 是主判据页：`?layer=core` 走「core 显式 + helper」，
  `?layer=gfx` 走「gfx 自动」，两条路径都报出纹素第 0 行 / 最后一行的颜色与 `rttRowOrderOk`
  （core 路径还报一份**不翻**的对照目标，那就是「加 helper 之前」的表现）。
  gfx 那一侧的材质刻意用默认的 `cullMode: 'back'`，所以绕序处理错会被剔除规则直接抓到。
- 单测：`test/rtt-row-order.test.ts`（两个后端的 `rowOrder` 取值、`mat4.flipClipY` 的数学与绕序、
  gfx 在纹理附件上翻 / 画布不翻 / `rowOrder: 'backend'` / 切通道恢复 / 预热与绘制用同一条管线）。
- 跨后端像素回归：`node scripts/verify-texture-parity.mjs --chrome <chrome.exe> --url ...`
  （同一页分别在两个后端跑 `?verify=1&spin=0`，比对 `data-*-pixel` 与 `data-*-lit-pixels`）；
  「上屏结果」的量化判据用 `scripts/capture-screenshot.mjs` 各抓一张合成截图，再交给
  `scripts/compare-screenshots.mjs`（它会给出原样 / 上下翻转 / 左右镜像 / 通道颠倒各自的一致率，
  翻转一致率异常高就是行序反了的决定性证据）。


