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

## [0.4.0] - 未发布

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

### 验证状态（如实标注）

- 判别依据：node 侧假 GL 的**逐字节**断言（假 GL 按 GL 的契约自己检查输入：数据够不够、
  format/type 组合合法不合法），加上只读原生探针（无头 Chrome + SwiftShader，不改任何库代码）。
- 五条锁定像素基线两后端**逐字命中**，另有 `rtt-orientation`(core) 与 `stencil` 两后端通过。
- `tsc --noEmit` 0 错误；`vitest run` **36 文件 / 557 用例全过**（本批新增 2 个测试文件、42 条用例）。
  （这是**本批合入当时**的数字；后续批次继续增长，见上面「一致性对齐」那一节的标注。）
- ⚠️ **没有验证的点**：深度读回「WebGL2 上完全不可行」这一结论只在本机 ANGLE/SwiftShader 上实测过
  （规范层面吻合，但未在硬件驱动上复核）；`alphaToCoverageEnabled` 只做了调用级验证
  （断言 `enable`/`disable` 真的下发），**没有像素级验证**（没有跑抗锯齿前后对比截图）。

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
