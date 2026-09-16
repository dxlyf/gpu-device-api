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

## 六、模板（stencil）语义：两个后端都是完整的

`DepthStencilState` 里与模板有关的字段在**两个后端上都是真语义**，没有降级、也没有近似：

| core 字段 | WebGPU | WebGL2 |
| --- | --- | --- |
| `stencilFront` / `stencilBack` 的 `compare` | `GPUDepthStencilState.stencilFront/Back.compare` | `gl.stencilFuncSeparate(FRONT/BACK, func, ref, readMask)` |
| 同上的 `failOp` / `depthFailOp` / `passOp` | `…failOp` / `…depthFailOp` / `…passOp` | `gl.stencilOpSeparate(FRONT/BACK, sfail, dpfail, dppass)` |
| `stencilReadMask` | `stencilReadMask` | `stencilFuncSeparate` 的 `mask` 参数 |
| `stencilWriteMask` | `stencilWriteMask` | `gl.stencilMaskSeparate(FRONT/BACK, mask)` |
| `setStencilReference(v)` | `GPURenderPassEncoder.setStencilReference(v)` | 同一个引用值进 `stencilFuncSeparate` |

**GLES 3.0 支持双面模板**，这一点值得单独写出来，因为一个常见的误解是「GLES 3.0 只有单面模板，
所以 WebGL2 只能取 `stencilFront`」。事实是 `stencilFuncSeparate` / `stencilOpSeparate` /
`stencilMaskSeparate` 本来就是核心功能（GLES 2.0 才有 `EXT_stencil_two_side` 那段历史），
所以两个面可以各自独立地下发 —— WebGL2 侧原来丢掉的只有「实现」。

### 曾经的缺陷（静默）

WebGL2 侧曾把模板状态整段丢掉：`ResolvedRenderState` 只带 `stencilEnabled`，下发时写死一句
`gl.stencilFunc(gl.ALWAYS, ref, 0xff)`，从不调用 `stencilOpSeparate` / `stencilMaskSeparate`
（`GL_STENCIL_OPS` 定义了却没有调用方）。于是 `{ compare: 'equal', passOp: 'replace' }` 这类配置
退化成「恒通过、不写」，**不报任何错**，画面就是错的。修复后的量化对照（同一页
`examples/stencil.html`、同一份模板配置，`scripts/analyze-screenshot.mjs` 统计合成 screenshot）：

| 场景 | 区域 | 修复前 WebGL2 | 修复前 WebGPU | 修复后 WebGL2 | 修复后 WebGPU |
| --- | --- | --- | --- | --- | --- |
| 基准（写模板 + `compare: 'equal'`） | 模板区外 | 100% 绿（32768 像素） | 0% 前景 | **0% 前景** | **0% 前景** |
| 同上 | 模板区内 | 100% 绿 | 100% 绿 | 100% 绿 | 100% 绿 |

（像素断言：模板区内 `0,255,0`、区外 `11,14,19`；修复前 WebGL2 的区外读回是 `0,255,0`，
与 WebGPU 明显不同。逐字段的参数断言见 `test/webgl2-stencil.test.ts`。）

### 两处容易踩的细节（都在实现里处理了）

1. **清屏受写掩码限制**。GL 的 `clearBufferfi` 清模板的部分会被 `STENCIL_WRITEMASK` 逐位过滤：
   上一条管线的 `stencilWriteMask` 是 0 时，下一次清模板**静默失效**，模板值跨渲染通道残留。
   实现里清深度/模板之前会把两个写掩码临时置成全 1（`GlStateCache.prepareClear()`），
   清完之后缓存作废、下一次下发真实掩码。清深度那一半（`DEPTH_WRITEMASK`）同理。
2. **状态缓存的去重键必须覆盖全部字段**。模板状态有 12 个字段（两个面各 4 个 + 引用值 +
   两个掩码 + 开关），漏掉任何一个都会让缓存误判「状态没变」而漏下发 —— 症状是
   「换条管线之后画面偶尔不对」，同样没有任何报错。`test/webgl2-stencil.test.ts` 对每个字段
   各写了一条「变了就必须重新下发」的用例。

### 唯一可表达的差异：掩码与参考值的位宽

WebGPU 的 `stencilReadMask` / `stencilWriteMask` / `setStencilReference()` 是 32 位整数
（缺省掩码是 `0xffffffff`），而 GLES 3.0 的模板缓冲在 `depth24plus-stencil8` 上只有 8 位：
GL 自己会把掩码与 `2^s - 1` 相与，所以传 `0xffffffff` 与传 `0xff` 在 GL 上是同一件事
（参考值同理）。这是**可表达**的差异（由 GL 负责截断），本库如实原样传递、不报错、也不改写
调用方的值；只是要知道「WebGPU 上第 8 位以上的掩码位在 WebGL2 上没有意义」。

除这一点之外，模板没有「无法表达」的子特性：两个后端的模型逐字段同构
（两个面各自独立、引用值单值、掩码单值）。仍然只能表达不了的只有深度侧的
`depthBiasClamp`（见 `glStateCache.setDepthTest()` 的注释）。

## 七、两后端行为对齐的四条契约（0.4.0 起）

这一节记录**同一份代码在两个后端上表现必须相同**的四件事。它们在 0.4.0 之前都**不一致**，
而且不一致的方向都是「一边静默、一边报错」或者「两边都静默」—— 属于最难排查的那一类。
每一条都写明选定的语义与理由（回归测试见 `test/webgl2-consistency-06.test.ts`）。

| # | 契约 | 对应项 |
| --- | --- | --- |
| 1 | 上一个 pass 还开着时 `beginRenderPass` / `finish()` 隐式结束它 | `#12` |
| 2 | 每个 pass 开始时 scissor 复位成「整个附件、关闭」 | `#14` |
| 3 | `clearBuffer` / `writeBuffer` 的校验两后端完全一致 | `#15` |
| 4 | `target` 与**非空** `colorAttachments` 不能同时给 | `#19` |

另有两条**能力边界**（不是「对齐」而是「如实暴露」）：`limits.maxTextureDimension1D = 0`（`#18`）
与立方体贴图 view 明确不可用（`#17`），见本节末尾。

### 1. 上一个 pass 还开着时，`beginRenderPass` / `finish()` **隐式结束**它（`#12`）

两个后端与 WebGPU 原生语义一致：开始新通道、或 `finish()` 时，前一个没 `end()` 的通道会被
**隐式结束**（走完 `end()` 的全部收尾：多重采样 resolve、时间查询 `endQuery`、状态作废）。

> 改前：WebGPU 后端隐式结束（与原生一致），WebGL2 后端抛 `ValidationError`
> —— 同一份上层代码一边正常一边抛错。

**为什么不对齐成「两边都抛错」**：core 层的定位是**显式镜像 WebGPU 形状**
（见 `core/Device.ts`），而「同时只能有一个打开的 pass」这条约束在 WebGPU 里的执行方式
就是「开始新 pass 时隐式结束旧的」。让 WebGL2 比它镜像的对象更严格，等于把 core 变成另一个 API。

⚠️ **这条契约有隐藏 bug 的风险，必须知道**：**忘记 `pass.end()` 不会报错**。
被隐式结束的通道会照常收尾，所以「少了一次 resolve / 少了一次时间查询」这类症状
不会有任何异常提示。写代码时请显式 `end()`，并用 `WebGL2CommandBuffer.passCount` /
`WebGPUCommandBuffer` 对应的统计对账。

### 2. 每个 pass 开始时 scissor 都复位成「整个附件、关闭」（`#14`）

WebGPU 的 `GPURenderPassEncoder` 在每个 pass 开始时把 scissor 重置为整个附件；
WebGL2 的 `SCISSOR_TEST` 与矩形都是**上下文状态**、会跨 pass 保留，所以本层在每个 pass
开始时显式复位（`GlStateCache.resetScissor()`，三条目标路径 + 默认帧缓冲 / 原始附件路径都会调）。

**为什么选「关闭」而不是「开着 + 整个附件」**：两者对画面的效果相同（整个附件的裁剪框
裁不掉任何像素），但「关闭」与本后端其余路径的默认状态一致，也不会让一条从未用过 scissor
的管线白白走上裁剪路径。**矩形同样被复位**这一点是必需的（不只是关开关）：`setScissor()`
只在开关打开时比较矩形，只关不设会让「矩形已经变了」被漏掉，某个 pass 里第一次
`setScissorRect` 就可能跳过 `gl.scissor()`、继续用更早的矩形。

> 改前：复位只在「要清屏」的分支里做，于是「上一个 pass 设过 `setScissorRect` →
> 本 pass 颜色与深度**都是** `load`」这条缝里，上一个 pass 的矩形继续生效，而
> `end()` 的 `invalidate()` 让状态缓存**声称** scissor 是关的（缓存与驱动不一致）。

### 3. `Queue.writeBuffer` 的校验在两个后端完全一致（`#15`）

`clearBuffer` 的 `offset` / `size` 4 对齐与范围、`writeBuffer` 的 `bufferOffset` 4 对齐、
`dataOffset` / `size` 的元素大小对齐与范围，**两个后端做同一组检查、抛同样的 `ValidationError`**
（消息逐字相同）。

> 改前：`clearBuffer` 的那几条只有 WebGPU 有（WebGL2 是 `size` 为 0 / 负数时**连一次调用都不发**、
> 超范围时让驱动记一条 `INVALID_VALID`，而本后端默认不查 GL 错误）；`writeBuffer` 的元素对齐
> 也只有 WebGPU 有（WebGL2 会把「起点落在元素中间」的视图照样上传）。
> 最隐蔽的是 `bufferOffset`：WebGL2 会把数据补齐到 4 的倍数，于是
> `writeBuffer(buf, 2, new Float32Array(1))` 在 WebGL2 上「成功」但真的写进了 `[2, 6)`
>（多两个 0 字节），WebGPU 则直接抛错。

### 4. `target` 与**非空** `colorAttachments` 不能同时给（`#19`）

两个后端都抛 `ValidationError`。用 `target` 时 `colorAttachments` 写 `[]`（该字段仍是必填的）。

> 改前：WebGL2 抛错、**WebGPU 静默忽略整个列表**只用 target 的附件 ——
> 调用方以为自己设的附件生效了（例如「用 target 定尺寸、用 colorAttachments 换 view」），
> 实际画进了 target 自己的附件，没有任何提示。

（顺带评估过把 `colorAttachments` 改成可选：那是公开 API 的放宽，会让
`{ target, colorAttachments: [] }` 这种写法失去唯一的规范形式，本批**没做**。）

### 4. `limits.maxTextureDimension1D` 在 WebGL2 上如实为 `0`（`#18`）

WebGL2（GLES 3.0）**没有** 1D 纹理，所以该 limit 报 `0`，含义与 WebGPU 专有的那些
storage / compute limit 在 WebGL2 上报 `0` 一致：**这个后端没有该能力**。

> 改前：报的是 `MAX_TEXTURE_SIZE`（本机实测 2048，即 2D 上限），而 `createTexture({
> dimension: '1d' })` 明确抛错 —— 「读 limits 判断能力」与「真的创建」这两个来源互相矛盾，
> 调用方会据此做出「支持 1D」的错误决策，直到创建那一刻才吃到异常。

**为什么不用「`height = 1` 的 2D 纹理模拟」来撑起这个数字**：数据确实装得下，但
`sampler2D` 与 `sampler1D` 是两个不同的着色器类型，本层没有「把 2D 纹理按 1D 采样」的表达方式。
请改用 `{ width: n, height: 1 }` 的 2D 纹理，或切到 WebGPU。

### 附：立方体贴图（`cube` / `cube-array` view）在 WebGL2 上明确不可用（`#17`）

`texture.createView({ dimension: 'cube' | 'cube-array' })` 在 WebGL2 后端抛
`ValidationError`，消息里写明根因与替代方案。

根因：GLES 3.0 的立方体贴图是**独立的纹理目标** `TEXTURE_CUBE_MAP`，有自己的分配方式与
「6 个面各一个偏移」的寻址；本后端的纹理按 `TEXTURE_2D` / `TEXTURE_2D_ARRAY` / `TEXTURE_3D`
分配，`sampler2DArray` 无法当 `samplerCube` 用。而且 core 的 `TextureDescriptor` 里也没有
cube 维度，所以「建一张 cube 纹理再建 cube view」这条退路同样不存在。

替代方案：用 2D array 纹理（`size.depthOrArrayLayers = 6`）承载 6 个面，在着色器里用
`sampler2DArray` 手动按面选层；或者切到 WebGPU（它有真正的 `cube` / `cube-array` view）。

> 改前：这两种维度会掉进 `WebGL2TextureView` 那条通用的「维度与纹理不一致」校验，
> 消息说的是「你把纹理的维度配错了」，**根因没被说出来** —— 调用方会去改纹理的
> `depthOrArrayLayers` / `dimension`（怎么改都还是错），而不是换方案。


