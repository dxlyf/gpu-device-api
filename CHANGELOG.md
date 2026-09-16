# 变更日志

本文件记录 `@dxyl/gpu-device-api` 每个版本的变更。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循语义化版本。

**阅读提示**

- 「修复（静默错误）」这一类最重要：它们**不报错、只是结果不对**，是使用方最难自行发现的问题。
- 每一条尽量给出**实测数字**；凡是**没有实测证据**的，会在文中明确标注（例如「待补测」「仅调用级证据」）。
- 记录依据是 git 提交与 npm 发布时间，不是回忆。

**关于早期版本**：仓库里的早期 tag 不严谨（`v0.0.4` 与 `v0.1.1` 指向同一时刻），因此 0.1.x 只能给出
可核实的概要；**自 0.2.0 起按版本逐一记录**。

---

## [0.4.0] - 2026-09-16

**状态：开发中。** 以下条目已实现并本地提交，但**尚未发布**。
发布前仍需：重建 `dist` 与 `src` 对齐、跑通全部双后端闸门、更新本节状态与日期。

本版目标：**让 `core` 层可在商业项目中放心使用**。优先级因此是
「静默错误清零 > 能力补齐 > 工程基建」，而不是「功能多少」。

### 修复（一批静默错误：WebGL2 纹素拷贝路径与 descriptor 字段）

本批五项**全部**属于「GL 有能力表达但本库没用上、或用了错的常量，而且默认不查 GL 错误 →
结果错但没有线索」。核心层要在商业项目里放心使用，这一类是最大的障碍。

- **WebGL2 `copyBufferToTexture` 对 3D / 数组纹理必然失败（`#6`）**
  旧实现只按 `bytesPerRow * height` 分配源数据，却把 `copySize.depthOrArrayLayers` 原样交给
  `texSubImage3D`，于是第 1 层之后读的是缓冲区之外的内存（实测驱动记一条 `INVALID_OPERATION`，
  本库默认不查 → 静默）。现在按
  `bytesPerRow * rowsPerImage * depthOrArrayLayers` 分配并校验，一次上传整叠 image。
  - 实测（本机原生探针）：`UNPACK_ROW_LENGTH` + `UNPACK_IMAGE_HEIGHT` + `UNPACK_ALIGNMENT=1` 下，
    非紧密多层上传逐层读回 **R=120 == 期望值**；只给 1 层数据时驱动报 `0x502`。
  - `Queue.copyBufferToTexture` 同形缺陷一并修掉。

- **WebGL2 忽略 `TexelCopyBufferLayout.rowsPerImage`（`#7`）**
  全后端没有 `UNPACK_IMAGE_HEIGHT`，`rowsPerImage != height` 时从第 2 层起数据全错。
  `gfx` 恰好总是传 `rowsPerImage = height`，所以示例与既有测试**暴露不了**这个问题。
  现在把它映射到 `UNPACK_IMAGE_HEIGHT`，并对数据不足给出带前缀的英文错误。
  - 紧密布局（`bytesPerRow = width*4`、`rowsPerImage = height`）**一次 `pixelStorei` 都不下发**，
    因此这条路径的 GL 调用序列与改动前逐条相同。

- **WebGL2 `copyTextureToTexture` 丢弃 `origin.z`、且把数组/3D 纹理挂到 `TEXTURE_2D` 附着点（`#8`）**
  旧实现只解构 `origin.x`/`origin.y`，两张纹理固定走 `framebufferTexture2D(..., COLOR_ATTACHMENT0, TEXTURE_2D)`。
  现在用 `framebufferTextureLayer` 表达层级、逐层 blit，并按格式选择 `DEPTH_ATTACHMENT` /
  `DEPTH_STENCIL_ATTACHMENT`（深度/模板纹理此前被当成颜色附件，blit 请求 `COLOR_BUFFER_BIT`）。
  - **报错行为随实现而异**：审计在另一台机器上报 `error 0x0` + FBO 完整，本机原生探针报
    `0x502` + `FRAMEBUFFER_INCOMPLETE_DIMENSIONS`。所以「靠 GL 报错兜底」不可靠，必须在库内校验。

- **WebGL2 从深度纹理 `copyTextureToBuffer` 静默返回全 0（`#9`）——本项处置为「明确报错」**
  实测（无头 Chrome + ANGLE/SwiftShader）：4 种深度格式 × 5 种 `readPixels` format/type 组合
  **全部 `0x500 INVALID_ENUM`**，目标缓冲**全 0**；显式把 READ 与 DRAW 都挂到同一个完整深度 FBO 上
  仍然如此（排除「绑错目标」）。规范层面也对得上：WebGL2 只接受 `RGBA`/`UNSIGNED_BYTE`、
  `RGBA`/`FLOAT`、`RED`/`FLOAT`，而深度附件报出的 read format 是 `DEPTH_COMPONENT`/`UNSIGNED_INT`
  （`WEBGL_depth_texture` 是 WebGL1 的扩展，WebGL2 没有它）。
  因此**无法实现**，改为在调用点明确报错并给出替代方案（把深度写进颜色附件再读回）。
  `source.aspect` 现在**真的被读取并校验**：`'stencil-only'` 明确拒绝，
  `depth24plus-stencil8` 上的 `'all'` 按 WebGPU 的规则回落成 depth 并在错误文字里点明。
  - 顺带修复：颜色数组纹理的读回以前只读第 0 层、`rowsPerImage` 被完全忽略；
    现在逐层挂附件、逐层 `readPixels`，并按 `rowsPerImage` 决定每层在目标 buffer 里的起点。

- **一批 descriptor 字段在 WebGL2 上静默无效（`#13`）——逐个决定「实现」还是「明确报错」**

  | 字段 | 处置 | 理由 |
  | --- | --- | --- |
  | `RenderTarget.mipLevelCount` | **报错** | GL 的 FBO 附件永远寻址第 0 级，「渲染进第 n 级」无法表达（WebGPU 侧对多重采样目标也是拒绝的） |
  | view 的 `format` 重解释 | **报错** | GL 没有 view 对象，采样用的始终是源纹理的内部格式 → 着色器按另一种格式解释同一段内存 |
  | view 的 `dimension` | **报错** | GL 的纹理目标在分配时定下，绑定点上无法切换维度 |
  | `RenderTarget.sampled: false` | **报错** | GL 的纹理只要能绑到纹理单元就能采样，没有「不可采样」状态 |
  | canvas 的 `alphaMode` | **报错** | 由 GL context 属性决定，创建后改不了；现在读回创建属性**逐字段对照** |
  | canvas 的 `colorSpace` | **报错** | WebGL2 的默认帧缓冲只有一种 8 位解释，`drawingBufferColorSpace` 不是渲染通道能携带的信息 |
  | `MultisampleState.alphaToCoverageEnabled` | **实现** | GL 有 `SAMPLE_ALPHA_TO_COVERAGE`，下发 `enable`/`disable`；`sampleCount === 1` 时报错（与 WebGPU 的 `toGPUMultisampleState` 同形） |
  | layout 的 `texture.sampleType` | **实现** | `sampleTypeMatchesFormat` 早就写好了却无人调用；现在把它带进绑定计划槽位，供渲染通道在绑定时校验 |

### 修复（MRT：逐附件状态与 `null` 空位下标，不再静默降级）

本批三项都属于「MRT 的状态或下标被静默降级」：改前既不报错、也不是数值差一点，而是**画到了别的
地方**（或用了别的状态），且 `glError` 始终为 `0`。改动前的证据单独提交在 `f13396e`
（三个测试文件共 26 条用例、**14 条失败**：`#10` 六条、`#11` 五条、`#11.3` 三条）。

- **WebGL2 逐附件 blend / writeMask 曾被静默当成附件 0（`#10`）**
  改前把 `fragment.targets` 的逐附件状态当成整帧唯一的全局状态：blend 取「第一个带 blend 的
  `target`」、`writeMask` 取 `targets[0].writeMask`。实测 `targets: [{ blend: alpha }, { blend: additive }]`
  不报错且两个附件都用 alpha；`[null, { writeMask: Blue }]` 更是把写掩码**静默退回 `All`**。
  - 本机只读原生探针实测（真实渲染）：`gl.blendFunci` / `gl.blendEquationSeparatei` / `gl.colorMaski`
    **全为 `undefined`** —— WebGL2 的 GLES 3.0 基线表达不了逐附件状态。
  - 因此改为把 targets **归约**成一份全局状态：所有非空 target 逐字段相同就正常下发（可归约）；
    只要有一项不同，就抛带 `[gpu-device-api] ` 前缀的英文错误（说明原因与替代方案）。
    `null` 空位不参与比较（它表示「这个 location 没有输出」），所以
    `[null, { writeMask: Blue }]` 这类写法现在是**可表达**的。
  - 回归：`test/webgl2-mrt-target-state.test.ts`。

- **WebGL2 `colorAttachments` 的 `null` 空位让三处下标互相矛盾（`#11`，逐像素验证）**
  选定语义：**数组下标即 fragment output location**（与 WebGPU 同形，`null` 表示该 location 丢弃输出）。
  改前附件被压缩挂到 `COLOR_ATTACHMENT0..n`、`drawBuffers` 也被压缩，清屏却用原始下标 ——
  于是 `[null, view]` 变成「附件挂在 0、清屏清 1、location 0 又写进 view」。实测 `[view, null]` 的
  `drawBuffers` 只有 1 项（尾部空位被丢掉）、`[view, null, view]` 的第二个附件被挂到 1 而不是 2。
  - **改前的真实逐像素证据**（WebGL2 + SwiftShader，只读原生探针，逐像素读回）：
    `a=[255,0,0,255] b=[0,255,0,255] c=[255,0,0,255] d=[0,255,0,255] e=[255,0,0,255] f=[255,0,0,255]`，
    且 **`glError=0`**。其中 `d` 该是洋红却保持绿（**洋红清屏没落地**），`e` / `f` 该得蓝 / 绿却都
    拿到红（**location 0 串味**）—— 全部静默。
  - **改后**同一探针：
    `a=[255,0,0,255] b=[0,255,0,255] c=[255,0,0,255] d=[0,255,255,255] e=[0,0,255,255] f=[0,255,0,255]`，
    `glError=0`，**6/6 逐条命中**。
  - 三处对齐：附件挂 `COLOR_ATTACHMENT0 + 原始下标`；`drawBuffers` 逐位置（空位 `GL_NONE`）；
    清屏用原始下标。
  - 另补两层守卫：① `MAX_DRAW_BUFFERS` 校验（**槽位数含空位**，超限时在创建任何 GL 对象之前就
    明确报错，而不是让 GL 报 `INVALID_VALUE`；假 GL 查不到该枚举时退回 GLES 3.0 下限 **4**，
    真机实测该值是 **8**）；② 多重采样路径的对齐校验（那条路径的 `drawBuffers` 与 resolve blit
    固定在渲染目标自己的附件顺序上，空位会被静默忽略 —— 空位 / 子集 / 换序都明确报错，
    整组按序继续放行）。
  - 回归：`test/webgl2-mrt-attachment-slots.test.ts`。

- **WebGPU 侧 `[a, null]` 与 `[null, a]` 曾撞同一个变体键（`#11.3`）—— 处置为明确报错**
  pass 布局的 `formats` 只收非空附件（而原生 `colorAttachments` 保留空位），所以 `[a, null]` 与
  `[null, a]` 推导出**同一个变体键**（`rgba8unorm|1|none`）：实测 `createRenderPipeline` 只被调用
  **1** 次，两条布局共用**同一条原生管线**，空位后面的 targets 整体前移一位。
  - 完整修法要动公开类型 `RenderPipelineVariant.colorFormats`（把密集列表改成**逐位置**），
    不在本批所有权内，因此本批改为：**「空位后面还有非空附件」直接明确报错，尾部空位继续放行**。
  - 浏览器实测原生 WebGPU（Chrome / DX12）确认了这条边界：`[view, null]` + 密集 `targets` →
    原生**接受**（像素 `255,0,0,255`，无 validation error）；`[null, view]` + 密集 `targets` →
    原生报 `Attachment state ... { colorTargets: [0=Undefined, 1=RGBA8Unorm] } ... { colorTargets: [0=RGBA8Unorm] }`
    （正是「密集列表表达不了空位」）；而 `targets: [null, state]`（**逐位置**）+ `[null, view]` →
    原生**接受**，且 location 1 正确收到绿色。**结论：「逐位置 `targets`」是正解**，
    完整修法见下面的「已知限制」。
  - 回归：`test/webgpu-mrt-null-slots.test.ts`。

- **本批验证状态**：`tsc --noEmit` 0 错误；`vitest run` **39 文件 / 591 用例全过**
  （基线 36 / 557；本批三个新测试文件到修复提交为止共 34 条用例）。

### 修复（两后端行为与校验的一致性对齐：同一份代码不该一边正常一边抛错）

本批七项的共同点是**同一份上层代码在两个后端上表现不同**，或者**校验只有一侧有**。
逐项都写明了选定的语义与理由（细节见 `docs/backend-limits.md` 第七节，
回归测试见 `test/webgl2-consistency-06.test.ts`）。

| 项 | 改前的差异 | 改后 |
| --- | --- | --- |
| `#12` 上一个 pass 还开着 | WebGPU 隐式结束；**WebGL2 抛错** | 两后端都**隐式结束**（对齐 WebGPU 原生语义） |
| `#14` 全 `load` 的 pass | 上一个 pass 的 scissor 仍生效（缓存还声称已关） | 每个 pass 开始时 scissor 复位成「整个附件、关闭」 |
| `#15` `clearBuffer` 的 4 对齐 / 范围 | 只有 WebGPU 校验，**WebGL2 静默接受** | 两后端同一批非法输入抛**同一个错**（消息逐字相同） |
| `#15` `writeBuffer` 的元素对齐 | 只有 WebGPU 校验 | 同上（WebGL2 补齐；WebGPU 顺带补上范围校验） |
| `#15` `writeBuffer` 的 `bufferOffset` 4 对齐 | WebGL2 靠补齐**多写**了几个 0 字节，WebGPU 抛错 | 两后端都抛同一个错 |
| `#16` disposed 设备 | WebGPU 抛 `ValidationError`、WebGL2 抛 `DeviceLostError` | 两后端都抛 `DeviceLostError`（`reason: 'destroyed'`） |
| `#17` `cube` / `cube-array` view | WebGL2 报的是误导性的「维度不一致」 | 单独识别，写明根因与替代方案 |
| `#18` `maxTextureDimension1D` | WebGL2 报 2D 上限（2048），而创建 1D 纹理会抛错 | WebGL2 如实报 `0` |
| `#19` `target` + 非空 `colorAttachments` | WebGL2 抛错、**WebGPU 静默忽略整个列表** | 两后端都抛错 |

- **`#12` 提醒（有代价的对齐）**：对齐成隐式结束之后，**忘记 `pass.end()` 不会报错** ——
  通道仍然会走完收尾（多重采样 resolve、时间查询 `endQuery`），所以「少了一次 resolve」
  这类症状没有任何异常提示。要选「两边都抛错」也是可行的，代价是与 core 镜像的 WebGPU
  语义不一致、会让 core 变成比原生更严格的另一个 API，本批选了「对齐 WebGPU」。
- **`#14` 为什么也复位矩形（不只是关开关）**：`setScissor()` 只在开关打开时比较矩形，
  `end()` 的 `invalidate()` 又会清掉矩形记录，所以只关不设会让「矩形已经变了」被漏掉，
  某个 pass 里第一次 `setScissorRect` 可能跳过 `gl.scissor()` 继续用更早的矩形。
- **`#16` 顺带对齐**：WebGPU 后端 `dispose()` 现在也会填 `lostInfo`
  （`reason: 'destroyed'`）并 resolve `device.lost`，与 WebGL2 一致 ——
  跨后端的恢复代码几乎都靠「先看 `disposed` / `lostInfo` 判断该不该重建」，
  只有一侧填信息时，同一段逻辑在 WebGPU 上会把「已经释放」误判成「设备还在」。
- **公开 API**：没有收窄。`RenderPassDescriptor.colorAttachments` **仍是必填字段**
  （用 `target` 时写 `[]`）。评估过把它改成可选，那属于公开 API 放宽，
  本批没做 —— 保持「有没有附件」这件事只有一种表达方式。
- **`limits` 的一处**：`maxTextureDimension1D` 从 2048 变成 `0` 是**有意的可观察变化**，
  含义与 WebGL2 上那些 `0` 值的 storage / compute limit 相同：「本后端没有该能力」。
- **本批验证状态**：`tsc --noEmit` 0 错误；`vitest run` **40 文件 / 613 用例全过**
  （本批新增 `test/webgl2-consistency-06.test.ts` 共 22 条用例，基线 39 文件 / 591 → 40 / 613）；
  五条锁定像素基线两后端**逐字命中**。改前证据是单独一次提交
  （`git log` 里的「先落复现证据」），那一版里有 9 条复现用例通过、11 条目标契约用例失败。
  - ⚠️ **没有验证的点**：`#12` 的隐式结束在 WebGPU 侧只是「不抛错 + 原生 `beginRenderPass()`
    被调用了几次」（`WebGPURenderPassEncoder.end()` 是否真的被调到无法在 mock 上独立观测，
    因为 `closeOpenPass()` 与原生 pass 的 `end()` 之间没有可注入的缝）；`#14` 的 scissor 复位
    断言的是**下发的 GL 状态**，没有做「像素级：第二个 pass 的可见区域是整个附件」的截图验证；
    `#17` 的 cube view 结论基于 GLES 3.0 的纹理目标模型与本后端的实现方式，
    没有在真实驱动上尝试「用 `TEXTURE_2D_ARRAY` 当 `samplerCube`」这种不合法组合去反证。

### 新增（外部纹理、swizzle、映射状态、数组 / 3D mip、错误作用域等）

本版的新增能力来自三个批次：批 `02`（`06c120d`，七项小 API）、批 `03`（`896bcb7` + `83d81ad`，
映射状态与 WebGPU 数组 / 3D mip）、批 `07`（`04a336f`，错误作用域）。每条尽量给出实测依据；
批 `02` 的原生探针页是 `api-surface.html`（只读、未入库，其数值结论由该批汇报记录），
批 `03` 的两张探针页 `examples/native-mapstate-probe.html` 与
`examples/native-mipmap-shader-probe.html` **已入库、可复现**（结论也写在页面里）。

- **`Device.importExternalTexture()`（`#22`）**：`core` 新增 `ExternalTexture` 接口。
  - WebGPU 转发原生 `GPUDevice.importExternalTexture`；实现没有这个方法时给出**带替代方案的
    报错**（不假装有）；`colorSpace` 明确报错（规范的 descriptor 没有这个字段）。
  - **WebGL2 明确报错 + 替代方案**（改用 `copyExternalImageToTexture`）。原生探针实测：
    `gl.importExternalTexture === undefined`，且 `OES_EGL_image_external` /
    `OES_EGL_image_external_essl3` / `WEBGL_external_texture` **三个扩展全为 `null`** ——
    GLES 3.0 上没有任何等价物。
  - 接口文档写明**过期语义**（一帧有效、每帧重新导入），并如实列出本库只在三处校验：
    `expired` 透传查询、绑定进 bind group 时检查、以及**不假装能拦**「已绑定 bind group 里的
    过期句柄」。`device.features.has('external-texture')` 在 WebGPU 上按「原生有没有这个方法」
    上报（它不是 `requiredFeatures` 里的 feature），WebGL2 上恒为 `false`。
  - `WebGPUBindGroup` 的 `{ source }` 路径改走 `asGPUExternalTexture`（escape hatch 仍可用），
    过期时给出可定位的报错。

- **`TextureViewDescriptor.swizzle`（`#23`）—— 按实测的真实形状实现**
  - `core` 新增 `TextureSwizzleString` 模板字面量类型、`assertTextureSwizzle()`，以及只读的
    `TextureView.swizzle`（实际生效值，未指定时为 `'rgba'`）。
  - **一处规格漂移的实测**：真实 Chrome 接受的是**长度 4 的字符串**（`'rgba'` / `'r001'`），
    **不是**早期提案的 `{ r, g, b, a }` 对象 —— 探针实测传对象会被原生拒绝：
    `TypeError: Swizzle ('[object Object]') must be exactly a four-character string.`；
    `@webgpu/types@0.1.72` 里也是 `swizzle?: string`。本库按**字符串**实现，
    非法形态在**解析阶段**（`createView`）抛 `ValidationError`。
  - 默认值与原生的对照：**未指定时 descriptor 里是 `undefined`（不是 `'rgba'`）**，后端因此
    **一个字段都不多传**给原生 —— 「没写 swizzle」的调用形状与改动前逐字段相同（回归断言是
    逐字段快照 + `'swizzle' in descriptor === false`）。`swizzle` 也进了 view 缓存 key，
    否则 `createView({ swizzle })` 会命中此前无参调用的缓存条目而**静默不生效**。
  - WebGPU 只在显式给了值时才传 `createView`；**WebGL2 只放行 `'rgba'` 与省略**，其它值明确
    报错 + 替代方案（着色器里做通道选择 / 切 WebGPU）—— canvas 帧纹理那条手写 view 路径也
    一并拦下，否则会出现「普通纹理报错、canvas 静默忽略」。

- **`Queue.copyExternalImageToTexture` 的两个选项（`#25`）**：新增第 5 个参数
  `CopyExternalImageOptions`（`premultipliedAlpha`，默认 `true`；`colorSpace`，默认 `'srgb'`；
  默认值取自 WebGPU 的 IDL）。
  - 实现方式是「**未指定就不下发这个字段**」，由原生填自己的默认值 —— 调用形状与改动前
    逐字段相同，也彻底消除了「本库默认值与原生默认值漂移」的可能（这两个字段在原生的
    **destination** 上，不是 source）。
  - WebGL2：`premultipliedAlpha` 走 `UNPACK_PREMULTIPLY_ALPHA_WEBGL`，且与
    `UNPACK_FLIP_Y_WEBGL` **成对复原为 0**（否则会污染从不设置这两个开关的 `writeTexture` /
    `copyBufferToTexture` 路径）；**非 srgb 的 `colorSpace` 在任何 GL 调用之前明确报错**
    （GL 表达不了「转成哪个空间」，报错不留半截状态）。

- **`Device.createFence`（`#26`）**：`core` 的 `Device` 上声明为**可选成员**（`createFence?()`），
  第三方实现不必提供。
  - WebGL2：既有的 `gl.fenceSync` / `clientWaitSync` 实现被提到接口上（行为不变）。
  - **WebGPU 不实现，也不假装**：探针实测 `device.createFence === undefined` —— 原生 WebGPU
    没有 fence 对象，`onSubmittedWorkDone()` 不等价；本库没有造一个 promise 壳
    （`WebGPUFence` 保留为工具类，仅供需要时显式使用）。

- **`GPUInternalError` 独立类型（`#28`）**：`core` 新增 `GPUInternalError`
  （`code: 'INTERNAL_ERROR'`、`name` 同名）并从 `errors` 导出；`toGpuError()` 的原生
  `GPUInternalError` 分支返回它（此前折成基类 `GpuError`）。断言覆盖 `instanceof` /
  `constructor.name` / `code` / `message` 前缀 / `toString()`，以及三类原生错误互不吞掉。

- **`RenderPipelineDescriptor.layout` 接受 `BindGroupLayout`（`#39`，公开 API 放宽）**
  - `layout` 现在是 `PipelineLayout | BindGroupLayout | readonly BindGroupLayout[] | 'auto'`；
    既有写法（`'auto'` / `PipelineLayout` / 省略）的类型与行为都没变。数组的**下标即 bind group
    index**；**空数组明确报错**（原生会静默当成「没有布局」）。
  - 两个后端走**同一条**归一化 helper（`core` 的 `resolvePipelineLayoutLike()`）：WebGPU 侧
    合成的 `GPUPipelineLayout` **由管线负责释放**（调用方拿不到它的引用，留在设备里就是泄漏）；
    WebGL2 侧合成的绑定计划与手写 `createPipelineLayout()` 完全相同，也随管线释放。
  - 背景：此前要复用同一份 `BindGroupLayout`，必须手写
    `createPipelineLayout({ bindGroupLayouts: [layout] })` 包装 —— 本仓库的示例就是这么绕的
    （`examples/msaa-offscreen.ts`）。
  - ⚠️ WebGL2 侧的管线创建路径**没有真实跑通**（只有归一化测试与代码论证），见「已知限制」。

- **`asByteView()`（`#40`）**：`core/resources/Buffer.ts` 新增
  `asByteView(range: MappedRange): Uint8Array` —— `Uint8Array` 原样返回、`ArrayBuffer` 建视图，
  **两种情况都返回视图、永不拷贝**。
  - 它存在的理由是一个真实陷阱：`getMappedRange()` 返回 `ArrayBuffer | Uint8Array`，而
    `new Uint8Array(部分范围)` 是**逐元素拷贝**，写入会**静默丢失** —— 等于把 `#3` 刚修好的
    「静默丢写入」在调用方那里重现一层。测试既钉住陷阱本身（写入后假原生 buffer 的
    「GPU 侧内存」仍是 0），也钉住「`asByteView` 的写入真的到达 buffer」。
  - **没有改** `getMappedRange()` 的返回类型（会破坏既有用法）。

- **缓冲映射状态（`#24`，批 `03`）**：`BufferDescriptor.mappedAtCreation` 与只读的
  `Buffer.mapState`（三态 `unmapped` / `pending` / `mapped`）；`mapped` 改为由 `mapState`
  **派生**，状态成为唯一真相。
  - **原生探针实测**（`examples/native-mapstate-probe.html`，无头 Chrome + SwiftShader，
    结论写在页面里、可复现）：普通创建 `unmapped` → 刚调用 `mapAsync` 未 settle 时 `pending`
    → await 之后 `mapped` → `unmap()` 之后 `unmapped`；`destroy()` 之后原生仍报 `unmapped`；
    pending 期间 `getMappedRange()` 抛 `DOMException`（本库提前拦成 `ValidationError`）；
    已映射时再 `mapAsync` 抛 `DOMException`；已销毁 buffer 的 `mapAsync` 抛 `DOMException`；
    `mappedAtCreation: true` **创建即 `mapped`**、`getMappedRange(0, size)` 返回 `ArrayBuffer`、
    同一段范围再取一次抛 `DOMException`（重叠）、**没 `unmap` 就 `destroy()` 不抛**。
    探针里刻意用 `usage: COPY_SRC`（**不含** `MAP_WRITE`）配 `mappedAtCreation`，
    实测这条组合合法。
  - 附带一条实测：**这个 Chrome 的 `GPUBuffer.mapAsync()` resolve 的是 `undefined`**（不是
    `ArrayBuffer`），所以「`await mapAsync` 拿到内存」在两代实现上不可移植 —— 本库一律走
    `getMappedRange()`。
  - WebGL2 用**影子缓冲**模拟（创建时即分配影子并置为 `mapped`，`unmap` 时整段上传）；GL 侧
    没有 `pending` 窗口，状态只有两态，但对外行为对齐。两个后端一致：`mappedAtCreation` 之后
    没 `unmap` 就 `destroy()` 都不抛、状态都回到 `unmapped`，且**都不把被放弃的那次写入静默
    上传**（WebGL2 在 `destroy()` 时对被放弃的写法发一条 `warn`）。视图语义完全不变：
    `getMappedRange` 仍返回视图（非拷贝）、同段重复取同一块内存、`unmap` 后 detached。
  - 回归：`test/buffer-map-state.test.ts`（14 例）。

- **WebGPU 数组 / 3D mip（`#27`，批 `03`）**：`WebGPUTexture.generateMipmaps()` 现在支持
  `2d-array` 与 `3d`。此前有一道硬闸（`dimension !== '2d' || depthOrArrayLayers !== 1` 直接抛
  「only single-layer 2d textures are supported」）。**这不是「两后端能力互补」，而是
  WebGL2 一直能做、WebGPU 被本库拦下**：ES 3.0 的 `glGenerateMipmap` 本就接受 `TEXTURE_3D` /
  `TEXTURE_2D_ARRAY`（每层独立滤波）。
  - 缓存键从「级号」扩维为 `"<级>:<层>"` 复合键 —— 键漏字段会让第 2 层命中第 1 层的 view /
    bind group，**跨层串味且 GPU 不报错**（与 `#32` 同一类教训）。2d-array 逐层独立
    （源层 = 目标层）；3d 深度逐级减半（`max(1, depth >> level)`，目标第 s 片取源第 2s 片，
    z 方向不做面积平均 —— 见「已知限制」的近似说明）；单层 2d 路径逐字段不变（原两绑定管线、
    只建一条管线），数组 / 3D 用一条三绑定管线（多一个层级 uniform，按需创建）。
  - 层级必须由 uniform 显式传给片元着色器：`texture_2d_array` 的 `textureSampleLevel` 默认采
    第 0 层，不传就会「每层都拿第 0 层」，GPU 不报错但画面全错。
  - **修复过程中抓到的真错**：数组 WGSL 最初写成
    `textureSampleLevel(tex, samp, vec3f(uv, layer), 0.0)`，而 `texture_2d_array` **没有 vec3
    坐标重载** —— 原生 WGSL 编译器直接拒绝（正确写法是 `(tex, samp, uv, u32(layer), 0.0)`）。
    **这道错会通过全部单测**：node 侧 mock 的 `createShaderModule` 永远返回 `{}`、
    `createRenderPipeline` 也不校验；它是被新增的原生探针页
    `examples/native-mipmap-shader-probe.html` 抓出来的（见「已知限制」的探针方法论）。
  - 回归：`test/webgpu-mipmap-array.test.ts`（12 例，直接断言 `(级, 层)` 缓存键集合与每个 pass
    的目标 / 源 subresource 签名互不相同）—— 这只证明「下发给 GPU 的 subresource 选择是对的」，
    **证明不了真实采样值**（像素级结果没验成，见「已知限制」）。

- **错误作用域（`#20`，批 `07`）**
  - **`Device.pushErrorScope(filter)`** 返回 `ErrorScopeHandle`（`filter` / `label` / `active` /
    `filterMatched` / `errors` / `pop()`）；**`Device.popErrorScope()`** 返回
    `Promise<GpuError | null>`，其中 `null` **只表示「作用域内无错」**。两者都是必需成员
    （与既有 `create*` 同档）。
  - `filter` 与原生 `GPUErrorFilter` **同名**（`'validation'` / `'out-of-memory'` / `'internal'`）。
    **未配对的 `pop` 是拒绝（reject），不是 `null`** —— 「没有作用域」与「作用域内无错」必须
    区分；设备在作用域还没 `pop` 时被 `dispose()` 也一样**拒绝**（返回 `null` 等于撒谎说
    「没有错误」）。非法 `filter` 与未配对的 `pop` 在两个后端给出**逐字相同**的消息
    （两后端共用同一个校验函数与同一条文案）。
  - 设计动机：此前调用方**无法以编程方式**知道 `create*` / 命令录制是否非法，只能靠 `onError`
    或异步回调 —— 属「不可用」而非「不够好」。
  - WebGPU 侧原生转发 `GPUDevice.pushErrorScope` / `popErrorScope`，错误经 `toGpuError` 翻译；
    实现没有暴露这两个方法时如实报错并建议改用 `onError`。
  - WebGL2 侧用 `gl.getError()` 轮询做等价物（新增 `src/webgl2/utils/glErrorScope.ts`），
    并如实写明做不到的事（四条限制见「已知限制」）。与既有 debug `getError()` 轮询的冲突用
    「**收敛成唯一读取点**」解决：debug 轮询与作用域都从 `WebGL2Device.drainGlErrors()` 拿结果，
    读到什么就同时给两边记账，不再出现「先跑的读走错误、后跑的误报无错」；debug 通道的消息与
    `code: 'GL_ERROR'` 保持**逐字不变**（那是机器可读的既有契约）。**默认零开销**：不 push
    作用域且 debug 关闭时一次 `gl.getError()` 都不读（`device.glErrorReadCount` 可断言）。
  - **端到端实测**（未入库的端到端探针页 `library-error-scope-e2e.html`，两后端）：作用域抓到
    `ValidationError`、空作用域为 `null`、**错误之后渲染仍然真的执行**（离屏目标像素
    `255,0,0,255` → `0,255,0,255`）。
  - 回归：`test/error-scopes.test.ts`（42 条）。

### 工程与文档（CI 与发布流程从无到有，附仓库清理）

- **新增 CI：本仓库的第一道自动防线（`0794e7a`）**
  `.github/workflows/ci.yml`（push / pull_request / 手动触发，Node 24 + pnpm 12.3.4）跑五步：
  `pnpm install --frozen-lockfile` → `tsc --noEmit` → `vitest run` → `pnpm run build` →
  **`git status --porcelain -- dist` 必须为空**。此前仓库完全没有 CI：`tsc` / `vitest` / 像素基线
  全靠人工跑，推送到 GitHub 没有任何自动拦截。
  - 最后一步的价值是**机械拦住「改了 `src` 却没重建 `dist`」**。该缺陷在本项目**真实发生过两次**，
    其中一次导致「仓库里的产物 ≠ npm 上实际发布的包」，而且是**发布之后**才发现的。
    「工作区干净」不等于「`dist` 与 `src` 同步」—— 这两个概念混过一次。
  - 「校验 dist」这一步不是推测出来的：把构建重定向到一个不写 `dist` 的临时目录后，与提交的
    `dist` 逐文件比对 —— **340/340 文件同集合，339 个逐字节相同**，唯一差异是
    `scripts/postbuild.mjs` 补的那行 `/// <reference types="@webgpu/types" />`（CI 跑的是完整
    build，故该差异不存在）；另确认 `dist` 全部为 LF、bundle 未压缩（没有 esbuild minify
    这类与平台相关的步骤）。
  - **像素基线故意不进 CI**：它们依赖 SwiftShader 参数、本机固定的 Chrome 路径，以及「两个后端的
    参数不能同时加」，在 GitHub runner 上行为未知；放一个不稳定的必过项会把「红」变成常态。
    五条锁定基线仍按 `docs/releasing.md` 第三节在本地手跑。
  - ⚠️ **未在真实 GitHub runner 上验证**（本机无法执行 Actions）。降风险的做法：`actionlint`
    v1.7.12（下载后核对过 sha256）对工作流报 0 问题；工作流里每条命令都在本机用同一套依赖实跑过；
    三个 action 的 `with:` 输入名与 `using` 运行时逐个核对过。首次推送后以 GitHub 的实际结果为准。

- **新增 `docs/releasing.md`**：发版前清单（含本地跑五条基线的完整命令与期望值）、版本号与
  `CHANGELOG.md` 的约定、tag 现状、`npm publish` 与 `prepublishOnly` 的关系、发布后核对、
  「`dist/` 是否入库」的取舍，以及 CI 覆盖什么 / 不覆盖什么。

- **`engines.node` 声明曾被加上又撤掉（`da69c03`）**：本库的产物是**预构建的浏览器 ESM bundle**，
  `engines` 是对**使用方**的运行时要求；而 Node 24 只是本仓库的**构建工具链**版本，从未作为
  使用方运行时验证过。声明一个未验证的下限，只会让 Node 20 / 22 的使用方收到 `EBADENGINE` 警告。
  构建工具链要求改为在 CI 与 `docs/releasing.md` 里钉死（`package.json` 里也**不加**
  `packageManager` —— 它与 `pnpm/action-setup` 的 version 同时存在会被判为「版本被指定了两次」
  而报错）。**净效果：0.4.0 相对 0.3.0 不新增 `engines` 声明。**

- **仓库清理**：删掉误入库的临时探针目录 `.tmp-probe/`（3 个被跟踪文件：`README.md` /
  `gl-probe.html` / `gl-probe.ts`；内容仍在 git 历史里，需要时可恢复），以及散落截图
  `image.png`（275 KB、966x678、**无任何文件引用**）。

### 验证状态（如实标注）

- 判别依据：node 侧假 GL 的**逐字节**断言（假 GL 按 GL 的契约自己检查输入：数据够不够、
  format/type 组合合法不合法），加上只读原生探针（无头 Chrome + SwiftShader，不改任何库代码）。
- 五条锁定像素基线两后端**逐字命中**，另有 `rtt-orientation`(core) 与 `stencil` 两后端通过。
- `tsc --noEmit` 0 错误；`vitest run` **36 文件 / 557 用例全过**（本批新增 2 个测试文件、42 条用例）。
  （这是**本批合入当时**的数字；后续批次继续增长，见上面「一致性对齐」那一节的标注。）
- **本版（0.4.0）截至开发末期的本地实测总数**：`tsc --noEmit` 0 错误；`vitest run`
  **44 文件 / 715 用例全过**。逐批增长为 36 / 557（批 `04`）→ 39 / 591（批 `05`）→
  40 / 613（批 `06`）→ 41 / 646（批 `02`）→ 43 / 673（批 `03`）→ **44 / 715**（批 `07`）。
  数字来源是各批提交信息，末值见批 `07` 的 `04a336f`（其后的 `db5dfd0` 只改注释）；
  44 文件 / 715 用例已于本次整理时在本机复跑核实（`Test Files 44 passed (44)`、
  `Tests 715 passed (715)`，exit 0）。
- ⚠️ 本节原有的两条未验证点（`#9` 深度读回只在本机 ANGLE/SwiftShader 上实测、
  `alphaToCoverageEnabled` 只有调用级验证）**已并入下面「已知限制（如实标注）」** ——
  那里还集中了其余批次如实标注的限制，并区分了「实测」「仅调用级」「未确证 / 推理」。

### 已知限制（如实标注）

以下限制原先散落在各批的汇报里，集中在这里以便使用方**一处看到全貌**。凡标注「仅调用级」
「未实测」「未确证」「转述」的，都**没有**像素级或硬件级证据。

**`#1`：`setViewport` / `setScissorRect` 的 helper 不提供跨后端归一（0.4.0 补测后的新结论，务必读）**

0.3.0 里标注的「`#1` 的两后端浏览器实测待补」**现已完成**，而且结论与当时的预期相反：

- `toNativeScissorRect` / `toNativeViewportRect` 只把「左上原点矩形」换算成**该附件自己的原生
  坐标**，**不负责让两个后端落到同一图像区域**。实测（`examples/scissor-origin.html` +
  `scripts/verify-scissor-origin.mjs`，无头 Chrome，附件 64×64；`R` = 红 = 图像上半，
  `G` = 绿 = 图像下半，`K` = 被裁掉；读数是附件自己的纹素行序）：
  - WebGL2 **离屏不翻投影**：不转换的 `(0,0,64,32)` → 保留**下半**；`helper(0,32,64,32)` →
    保留**上半**。
  - WebGPU **离屏不翻投影**：不转换的 `(0,0,64,32)` → 保留**上半**；`helper(0,32,64,32)` →
    保留**下半**。
  - 也就是**两边都传 `'bottomLeft'`，却保留了相反的半区**。
- 原因：两个后端在「不翻投影的离屏附件」上**图像朝向本身就相反**（WebGL2
  `RenderTarget.rowOrder === 'bottomUp'`、WebGPU `'topLeft'`，与 `docs/backend-limits.md`
  第五节一致）—— helper 只做坐标换算，同一个 `imageOrigin` 在朝向相反的两个附件上必然落到
  相反的图像半区。
- **告示：调用方必须按「该附件自身的朝向」传 `imageOrigin`；同一条代码不可能靠一个常量在两个
  后端上同时正确。** 跨后端可移植的做法是依据 `RenderTarget.rowOrder` **逐通道**决定
  `imageOrigin`（或改走「离屏时显式翻投影」这条统一路径），而不是依赖固定常量。
- **WebGPU 的 canvas 通道结构性不可测**：交换链没有 `COPY_SRC`，`getCurrentTexture()` 读不回
  主机，所以 canvas 那一侧**只有 WebGL2 有实测**，WebGPU 是规范期望（探针页用
  `data-gpuCanvasExpected*` 如实标注，未谎报为实测）。
- **本版不提供便利 API**：不加「按 `rowOrder` 自动选 `imageOrigin`」的入口 ——
  `RenderTarget.rowOrder` 已经暴露了所需信息，加一个自动入口要动公开面，并多一轮完整的
  验证 / 重建 / 发布。若将来提供，那会是一次**新增**；**目前尚未提供**。
- 附注：`8cc5f4c` 里那张标着「实测」的 TSDoc 表**当时并未跑浏览器**（同一次提交的说明里写着
  「因环境内存不足未能跑浏览器验证」），现已按真实读数更正，并补上「两个后端的 `imageOrigin`
  取值不是同一套参照系」这条当时没有的结论 —— 见 `src/core/render/ScissorOrigin.ts` 的 TSDoc
  与 `docs/backend-limits.md` 第八节。

**能力边界：本库会拒绝，或只做近似**

1. **WebGL2 读回深度纹理（`#9`）被处置为明确报错，依据只有本机 ANGLE/SwiftShader 实测**
   （4 种深度格式 × 5 种 `readPixels` format/type 组合**全部 `0x500 INVALID_ENUM`**，
   目标缓冲全 0；显式把 READ 与 DRAW 都挂到同一个完整深度 FBO 上仍然如此）。规范层面吻合
   （WebGL2 的 read format 不接受 `DEPTH_COMPONENT` / `UNSIGNED_INT`），但**若某个硬件驱动
   额外支持深度读回，本库会误拒**。「保守拒绝」优于「静默给错数据」，代价就是这个误拒 ——
   这是已知限制。
2. **多颜色附件的 MSAA resolve 未实测**：`resolve()` 用 `blitFramebuffer`，而 GLES 3.0 的 read
   buffer 默认是 `COLOR_ATTACHMENT0`，所以**怀疑它只解析附件 0**（多目标 MSAA 时其余附件
   可能根本没被解析）。这一条**未做实验确证** —— 是批 `05` 提出的怀疑，不是实测结论。
   后续要碰 MSAA 多目标时**先实测这一点**。
3. **`#8`（`copyTextureToTexture` 的 `origin.z` / 数组层）与 `alphaToCoverageEnabled`
   只有调用级证据，无像素级验证**：前者断言的是**下发的 GL 调用**真的落到了
   `framebufferTextureLayer` 上（逐层 blit）；后者只断言 `enable` / `disable` 真的下发，
   **没有**跑抗锯齿前后对比截图。
4. **`#39`（`layout` 接受 `BindGroupLayout`）的 WebGL2 管线路径没有真实跑通**：WebGPU 侧用
   mock 原生设备验证了布局合成、顺序（下标即 bind group index）与随管线释放；WebGL2 侧只有
   类型 / 归一化测试，加上「合成走的是与手写 `createPipelineLayout()` 完全相同的共享 helper」
   这一**代码论证**，没有真正创建过 WebGL2 管线（批 `02` 自标为「本批最弱的一环」）。
5. **`#27` 数组 / 3D mip 的像素级结果没验成**：本机 SwiftShader 的数组采样**错位**（连「层号写死
   `0u` + 源 view 只覆盖第 0 层」都采到第 1 层的值），因此**无法区分环境错位与本库行为**；
   正确性目前只由 node mock 的 subresource 断言覆盖 —— `test/webgpu-mipmap-array.test.ts` 的
   文件头已自述「mock 只能证明下发给 GPU 的 subresource 选择是对的，证明不了真实采样值」。
   另外 **3D 的 z 向滤波两后端语义不同**：GL 是面积平均，本实现取最近源片，属**已知近似**。
6. **WebGPU 侧「`null` 之后的附件」目前只明确报错**，完整修法（把
   `RenderPipelineVariant.colorFormats` 从密集列表改成**逐位置**，空位用 `null` 占位）已推迟；
   原生实测已确认该修法可行（见上文 `#11.3`）。
7. **`#12` 对齐 WebGPU 后：忘记 `pass.end()` 不再报错**（两后端都隐式结束）—— 这是**有意偏离**
   「早暴露调用方错误」的选择。代价见上文「一致性对齐」一节的 `#12` 提醒：通道仍会走完收尾，
   所以「少了一次 resolve」这类症状没有任何异常提示。

**验证覆盖面上的限制**

8. **`#20` 错误作用域在 WebGL2 上的四条限制**（由 GL 的错误模型决定，不是实现取舍）：
   **无法分类**（GL 错误码分不出 validation / out-of-memory / internal）、
   **无法归属**（只能回答「这段时间内出现过某类错误」，不能回答「就是那一行」）、
   **计数只是下界**（`getError()` 队列只保留一条，同一次调用产生的多个错误会互相覆盖；实测连续
   3 次非法调用只读到 1 条 `0x500`，其余为 `0x0`）、
   **`filter` 只表示「这条错误留在哪一层」**（不改变错误类型，`filterMatched` 可能是 `false`
   而 `pop()` 仍有值）。
   两后端一致的一条：**库自身的参数错误是在调用点同步 `throw` 的**，不经过原生错误通道，
   因此 `pushErrorScope` / `popErrorScope` **抓不到**。
9. **多数像素证据来自 SwiftShader 软件光栅化**（本机无头 Chrome + ANGLE/SwiftShader）；
   WebGPU 探针跑在真机 Intel gen-9 适配器上 —— **桌面独显 / Metal / Vulkan 后端未验证**。
10. **闸门批量跑时偶发 `depth-gpu` 瞬时 `fail`**（本机同时有用户自己的十余个 Chrome 进程）：
    **单独重跑同一 URL + flags 即过**，判为并发争用，不是回归。记录在此以免日后被误当 bug 追。
11. 上文各节还留有若干**未验证点标注**（`#12` 隐式结束的观测深度、`#14` 只断言下发的 GL 状态、
    `#17` cube 结论的论证方式，以及批 `06` 那一节列出的三条），此处不重复。

**探针方法论：为什么结论都来自实测，而不是规范推演**

12. `createBuffer({ size: 0 })` 被原生**接受** —— 拿它当「非法调用」的触发器会得到误导性结论。
    ⚠️ 这一条**转述自批次汇报，仓库里没有留档的探针文件或提交信息，本条未复核**。
13. **负数 mip level 被驱动报成 `INVALID_OPERATION`（`0x502`）**，而不是规范暗示的
    `INVALID_VALUE`（本机只读原生探针实测）。
14. **node 侧 mock 的 `createShaderModule` 永远返回 `{}`**，`getCompilationInfo` 不存在、
    `createRenderPipeline` 也不校验 —— **着色器层面的错误在单测里一个都发现不了**：批 `03` 的
    一道错 WGSL（`texture_2d_array` 用了不存在的 `vec3` 坐标重载）通过了全部单测，只在浏览器
    第一次真正生成数组 / 3D 的 mip 时才被原生编译器拒绝。为此补了原生探针页
    `examples/native-mipmap-shader-probe.html`。**结论：不要靠规范推演，要用只读原生探针实测。**
15. 探针本身也有两个已知的坑（批 `03` 留档）：`copyTextureToBuffer` 的 `bytesPerRow` 必须是
    **256 的倍数**（传 32 会让整个 command buffer 作废、读回**静默全 0**）；源纹理必须带
    `COPY_SRC`。

**已推迟 / 已决定不做**

16. **`mipLevelExtent` 对 3D 的 `depth` 处理仍不符合 WebGPU 规范**：目前对 `2d` / `2d-array` /
    `3d` 一律把 `depthOrArrayLayers` 当作「不减半」（`src/core/resources/Texture.ts` 的注释也这么
    写着），而规范对 3D 是 `max(1, depth >> level)`。批 `03` 的实现**绕开了这个 helper**
    （自己算 `max(1, depth >> level)`），所以 `#27` 的行为不受影响，但该导出 helper 本身对 3D
    会算错 —— 推迟（派工书 `.tmp-briefs/12-*.md`）。WebGPU 空位的完整修法见第 6 条
    （派工书 `.tmp-briefs/10-*.md`）。
17. **`#21` render bundle 已决定不做**：纯能力新增，对「能放心使用」贡献最小、成本最高
    （约 3 h），且 WebGL2 侧本就表达不了。

---

## [0.3.0] - 2026-09-16

### 修复（三项静默错误）

- **WebGL2 曾完全忽略模板（stencil）状态**  
  此前 `glStateCache` 硬编码 `stencilFunc(ALWAYS, ref, 0xff)`，`compare` / 操作 / 掩码 / 双面全部被丢弃，
  于是 `{ compare: 'equal', passOp: 'replace' }` 在 WebGL2 上退化成「恒通过、不写」，**且不报任何错**。
  现在用 GLES 3.0 的 `stencilFuncSeparate` / `stencilOpSeparate` / `stencilMaskSeparate` 真正实现**双面**语义，
  `setStencilReference` 的引用值也真正下发；去重键改为**逐字段比较**（两面各 4 个 + 引用值 + 读/写掩码 + enabled，共 12 个字段）。
  - 实测：修复前该示例页在 WebGL2 上 `fail`（模板门控区域**外**也变绿），修复后两后端 `data-*` **逐字节相同**。
  - 顺带修掉同源缺陷：`clearBufferfi` 清模板受 `STENCIL_WRITEMASK` 逐位过滤，上一条管线留下写掩码 0 时
    **清模板静默失效、模板值跨通道残留**。
  - ⚠️ 位宽差异如实保留：WebGPU 的掩码/引用值是 32 位，GLES 3.0 在 `depth24plus-stencil8` 上只有 8 位，
    GL 会自行与 `2^s-1` 相与；本库**原样传递、不报错、不改写**用户值。

- **`getMappedRange()` 曾返回拷贝 → 「部分范围写入」静默丢失**  
  旧实现用 `slice()` 返回**副本**，于是 `mapAsync('write')` → `getMappedRange(offset, size)` → 写入 → `unmap()`
  这条最常见的写入路径**静默不生效**（写进了临时副本，`unmap()` 时什么都没上传）。
  **两个后端一致地错**，所以没有任何跨后端对比能发现它。
  现在返回**映射内存上的视图**：整段范围返回 `mapAsync()` resolve 出来的 `ArrayBuffer`；部分范围返回建在
  **同一块映射内存**上的 `Uint8Array` 视图（WebGL2 为影子缓冲上的子视图）。同一段范围重复调用一定拿到
  指向**同一块内存**的视图（`view.buffer` 相同）；`unmap()` 之后视图失效。
  - ⚠️ **类型陷阱**：返回类型是 `ArrayBuffer | Uint8Array`，**不要**无脑 `new Uint8Array(range)` ——
    当 `range` 已是 `Uint8Array` 时该构造器会**逐元素拷贝**，等于把刚修好的静默丢失重现一层。
    正确写法是先 `instanceof` 判断（README 里有示例）。
  - 按实测修正的一处**文档级发现**：原生 `mapAsync(offset)` 之后 `getMappedRange(offset, size)` 的
    `offset` 是**相对 buffer 起点的绝对偏移**，而非相对映射起点 —— 这与 MDN 当时的措辞相反，但与规范原文
    和 Chrome 实测一致。本库按**实测**实现（该判断同时被记入源码注释）。
  - 实测：修复前该文件的复现测试 8/10 失败（部分范围写入实测全 0），修复后 10/10 通过。

- **WebGPU 每帧泄漏一个 command encoder**  
  `finish()` 此前不把 encoder 从设备资源追踪集合中摘除，而 core 的 `CommandEncoder` 接口没有 `dispose()`，
  因此「每帧建一个、`finish()` 后丢弃」会让追踪集合**无上限增长**，直到 `device.dispose()`。
  - 实测：连续 120 帧 `createCommandEncoder() + finish()` 后计数 `+120`，修复后回到基线。
  - 已确认 `finish()` 之后除幂等的 `dispose()` 外**所有方法都会抛错**，因此提前摘除不会留下悬空引用。
  - **WebGL2 侧没有这个问题**：它从不 track encoder（命令立即下发、不持有 GL 资源）。

### 新增

- **`toNativeScissorRect` / `toNativeViewportRect`**（含 `NativeRect` / `ScissorImageOrigin` 类型，均从包根导出）：
  把「左上原点」的矩形转换成当前后端的原生坐标。第二个参数是**附件高度**（不是矩形高度），返回值位于
  附件的原生坐标系。
  - 背景：原生约定本就不同且**这是正确的** —— WebGL2 的 `gl.viewport` / `gl.scissor` 原点在**左下**，
    WebGPU 在**左上**。core 层**如实透传、不做任何 Y 变换**（core 是「显式镜像 WebGPU 形状」的层）。
  - ⚠️ **真正的坑**：gfx 默认对**纹理附件**做投影翻转，于是会出现**离屏通道恰好与 WebGPU 一致、canvas 通道不一致**
    的情况 —— 所以**不能从某一条渲染路径反推规则**，要按附件原点约定来判断。
  - **验证状态（如实标注）**：探针页 `examples/scissor-origin.html` 与校验脚本
    `scripts/verify-scissor-origin.mjs` 已随版本提供，但**两后端的浏览器实测一致率尚未补做**
    （该功能落地时宿主机内存不足，无法跑无头浏览器）。页面里的期望值来自规范与代码推导，**不是实测**。
- **`MappedRange` 类型**（`ArrayBuffer | Uint8Array`），用于表达 `getMappedRange()` 的视图语义。

### 变更（可能影响使用方）

- **`getMappedRange()` 的返回类型由 `ArrayBuffer` 变为 `ArrayBuffer | Uint8Array`**。
  这是为了让整段范围继续返回 `ArrayBuffer`（保持既有用法兼容），同时让部分范围能表达「同一块内存的一段」。
  TypeScript 使用方升级后如果对该返回值做了 `new Uint8Array(range)`，会看到行为变化（逐元素拷贝），
  请改为先 `instanceof` 判断或使用视图语义。

### 性能

本版集中优化了 WebGL2 的命令路径与缓存（`gl.copyBufferSubData` 等）。**所有收益都是实测数字**，
并且明确包含一项**「测过但无收益、未改」**的负结果。

| 优化 | 实测 |
| --- | --- |
| `gl.copyBufferSubData` 取代 CPU 往返 | 1MB **2.23ms → 0ms**、16MB **53.1ms → 0.003ms**，逐字节一致 |
| 读回 framebuffer 复用 + 收窄状态失效 | 读回**之后那一次 draw** 的固定功能状态下发 **13 次 → 0 次** |
| 混合状态去重键改数字比较 | 100 万次同值调用 **381ms → 5.4ms（约 70×）** |
| FBO 缓存改对象身份键 + 精准淘汰 | 显式同 label 的两张纹理改前 `a === b` 为 `true`（**画进错误纹理**）→ `false`；销毁一张只淘汰相关条目 |
| VAO 缓存加上限（每变体 LRU 64） | 80 组不同顶点绑定的条目数 80 → **封顶 64** |
| WebGPU mipmap 的 view / bind group 按级缓存 | `createView` **40 → 8**、`createBindGroup` **20 → 4**（第 2 次起零新建）；反复 20000 次新建原生对象 **480000 → 0** |
| 变体解析改 4 条 MRU 备忘 | 两个变体交替时解析次数 **24 → 2**；同进程前后代码交替计时 **450.7ms → 112.1ms（4.02×）** |
| pass 建立期零分配 | `JSON.stringify(clearValue)` 与每附件 `new Float32Array` 各 **2 → 0** |
| `WebGL2Queue.writeBuffer` 的视图构造 | **无实测收益，未改** —— 微基准显示替代写法 **1.110× 更慢**（在噪声内） |

两点附带修正：

- `gl.copyBufferSubData` 相关代码里原有一句注释写「WebGL2 没有 `copyBufferSubData`」，**实测该函数存在**，注释已改正。
- VAO 缓存加上限时**发现并修掉一个潜在静默错误**：快速路径在特定版本号下会返回**已被淘汰的 VAO**
  （表现为 `INVALID_OPERATION` + 保持旧绑定 → 静默画错）。

### 工程与文档

- `.gitignore` 里用 GBK 写入 UTF-8 文件的一行乱码注释已修正；清除 5 个示例页的 UTF-8 BOM
  （仓库 400+ 个文本文件现统一为 UTF-8 / LF / 无 BOM）。
- `vite` 的文件监听忽略 `.tmp-*`（此前脚本往这些目录边写边被监听，Windows 上抛 `EBUSY` 会**直接搞崩 dev server**）。
- 无头脚本的 Chrome 临时 profile **不再泄漏**：根因是「kill Chrome 后立刻 `rmSync`」在 Windows 上抛 `EPERM` 且被静默吞掉，
  **正常退出也 100% 泄漏**（每次约 25 MB，曾累积 488 个目录、约 34 GB，把 C 盘压到只剩 232 MB）。
  现在所有退出路径都回收、启动时清扫陈旧目录（只认自己的前缀、不碰运行中的其它调用）。
- `examples/smoke.html` 明确标注**只跑 WebGL2**（着色器是 GLSL、读回用 `gl.readPixels`、另有三条 WebGL2 专有断言），
  并输出 `data-smoke-backend="webgl2"`，避免被误读成「两个后端都验证过」。
- README 新增「已修复的正确性问题」一节，并补入本版的性能与会话记录。

### 已知未完成

- `setViewport` / `setScissorRect` 原点 helpers 的**两后端浏览器实测**待补（见上）。
- `dist/` 的重建在此版本发布时一并完成（仓库跟踪 `dist`）。

---

## [0.2.0] - 2026-09-15

自 `0.1.1` 起 41 个提交。这是把库从「core 接口 + 两个后端」扩成**可用库**的版本。

### 新增

- **`gfx` 便捷层**：`Renderer`、声明式 uniform（→ 双语言代码生成）、`Material`、`Geometry`、`UniformArena`、
  相机与 `OrbitControls`、几何体生成、内置材质。配合 lil-gui 的示例页。
- **GPU 计时 / 查询体系**：两个后端都能读回真实 GPU 时间；`renderer.stats.gpuFrameTime`（拿不到为 `null`，
  不静默返回 0）；环形 query set + 延迟读回，**不每帧阻塞**。
  实测 WebGPU 2000 档 CPU 7.10ms / GPU **1.226ms**，20000 档 84.13ms / **8.215ms**；
  并用「同样 50 次全屏绘制、只把画布放大 5.14 倍 → GPU 时间随之变为 4.58×（WebGPU）/ 5.63×（WebGL2）」作为
  「测到的是真实光栅化工作」的独立判据。WebGL2 的数字来自 SwiftShader 软件光栅化，**不可当作硬件性能**。
- **纹理上传改造**：异步入口（`createImageBitmap`，URL / Blob / 已有 bitmap / canvas 四条路径读回逐字节 `maxDiff=0`）；
  mipmap 交后端生成；上传格式从 `rgba8unorm` 单一种扩到 6 种。
  实测 2048² 上传 + mip 生成：WebGL2 **52.7ms → 10.6ms**、WebGPU **47.1ms → 17.0ms**。
- **视锥剔除 + draw 排序**：`Geometry` 创建时算一次包围球，带 `perInstance` 的几何体默认不参与剔除。
  实测 20000 物体时 draw calls **20000 → 10617**（剔掉 9383），耗时 WebGPU **−24.7%/−26.6%**、
  WebGL2 **−45.7%/−55.6%**。排序默认关闭，当前基准场景**未测出收益**（单材质单绑定组）。
- **异步管线预热与编译诊断**：`renderer.prewarm()` / `renderer.compilationInfo()`。
  实测 WebGPU 首个使用该管线的帧 **469.9ms → 7.4ms**（真异步）；WebGL2 `createRenderPipeline`
  **347.7ms → 0.20ms**（本机缺 `KHR_parallel_shader_compile`，如实降级为 `mode:'sync'`）。
  编译错误能给出**真实行号**。
- **设备丢失检测**：两个后端都能检测并给出明确错误，设备丢失后不再静默丢弃命令。
  **抽象层内无法自动恢复**（只能新建设备并重建资源），这一点已如实写入文档。
- **WebGL2 离屏 MSAA**：`renderbufferStorageMultisample` + `blitFramebuffer` resolve。
  判据是真实合成截图里的**中间色像素**：`samples=1` 时 0 个、`samples=4` 时 3203 个，
  且恰好是 `sampleCount−1 = 3` 种、对应 25%/50%/75% 覆盖率。
- **WebGL2 资源 `untrack`**：此前追踪集合只增不减，逐帧创建/销毁会泄漏到 `device.dispose()`。
- **`RenderTarget.rowOrder` + `mat4.flipClipY`**：把「渲染到纹理」的纹素行序统一为
  **core 层显式（提供 helper，不代劳）/ gfx 层自动**。判据：core 的「不翻」对照是**原样一致率 1.44%、
  上下翻转 100.00%**，统一后为**原样 100.00%、翻转 1.44%**。

### 修复

- **sRGB 纹理的 mip 降采样错误**：旧的 JS 盒式降采样对 **sRGB 编码字节**求平均，实测第 4~6 级偏暗
  **61/255**（`127` vs 正确的 `188`）。改由后端生成 mip（WebGPU 用 render pass 而非 compute —— 硬理由是
  `rgba8unorm-srgb` 在 storage texture 里没有 srgb 变体，compute 无法把线性降采样结果正确编码回 sRGB）。
- **`depthStencil: { format: null }` 在 WebGPU 上不关深度**：曾回落到「写深度 + `less`」，于是用全屏三角形
  画天空这类写法会把整个深度缓冲写成 0，其后所有几何体被错误遮挡，**且没有任何报错**。
  修复前 WebGPU 绿像素为 **0**，修复后与 WebGL2 **逐数字相同**。
- **`copyTextureToBuffer` 忽略 `bytesPerRow`**：按 WebGPU 规范传 256 对齐行距的调用方在 WebGL2 上会读到
  整体错位的数据。实测某示例 `litPixels` 由 3006 修正为 **924**，与 WebGPU 完全一致。
- **`WebGL2Sampler` 的 mip 过滤映射错误**：`(nearest, nearest)` 曾被映射成不带 mip 的 `NEAREST`，
  导致显式 `textureLod(..., 4.0)` **静默只取第 0 级**。已按 WebGPU 语义修正全部组合（并区分纹理有无 mip）。
- **GPU 计时能力误判导致页面整体失败**：部分 Chrome 会「启用 `timestamp-query` 特性，
  但 `GPUCommandEncoder.writeTimestamp` 方法不存在」，旧检测只看特性标志 → 判定可用 → 记时间戳时抛错 →
  **整页失败**。现在探测**真实 API 表面**，且三条失败路径（创建 / 显式启用 / 运行中失败）全部
  **只降级不打断渲染**（`stats.gpuFrameTime` 变 `null`、错误可读）。定位该问题时还发现 WebGPU 的一条硬约束：
  pass 带深度附件时管线**必须**声明同格式的 `depthStencil`，所以「不使用深度」只能翻译成「恒通过 + 不写」。
- **`WebGL2Sampler` / `WebGL2RenderPipeline` 缺 `untrack` 钩子**（泄漏窗口）。
- **后端探测占用调用方 canvas**：WebGL2 可用性探测曾在调用方的 canvas 上执行 `getContext('webgl2')`，
  使其被永久绑定，导致随后 `getContext('webgpu')` 返回 `null`。已改用一次性探测 canvas + 候选后端回退链。
- 一批更早的缺陷（索引几何体完全不被光栅化、WebGPU 动态偏移未传给原生 `setBindGroup` 导致整条 command buffer
  失效等）见仓库提交历史。

### 移除

- **`scene` / `per-draw` uniform 拆分**（试过并回退）：机制成立（每 draw 上传 208 → 128 字节、场景块每帧只写一次），
  但 20000 draw 档 CPU 提交**稳定慢约 5%** —— 省下的 80 字节被「多一条动态偏移 binding」抵消。
  正解是把场景块挪进独立 bind group，但那会改变公开 API `Material.textureGroup`，故整体回退。
  完整的试做与回退记录见提交历史。

---

## [0.1.1] - 2026-09-14

### 修复

- 修正 README 的导入示例：去掉不存在的 `TextureFormat` 导出，`import` 改用包名 `@dxyl/gpu-device-api`。
  已按**发布后的包**实测 typecheck 通过。

---

## [0.1.0] - 2026-09-14

首个发布版本。

- `core` 层：显式镜像 WebGPU 形状的底层 API（Adapter / Device / Queue / Buffer / Texture / Sampler /
  BindGroup(Layout) / PipelineLayout / ShaderModule / RenderPipeline / ComputePipeline / QuerySet /
  CommandEncoder / RenderPassEncoder / ComputePassEncoder / CanvasContext 等），不做魔法、不代劳。
- 两个后端：WebGL2 与 WebGPU，外加后端探测与按可用性回退的工厂。
- `shaders` 模块：跨后端语言调度、GLSL 样板注入、WGSL / GLSL 接口反射。
- `gfx` 便捷层初版与 lil-gui 示例。
- 自带数学库（`utils/math`），可独立 import。
- 无头冒烟测试页：在真实浏览器里验证出图、离屏渲染与像素回读、以及若干错误路径。
