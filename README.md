# gpu-device-api

一套**统一的 WebGL2 / WebGPU 抽象**：上层写一份代码，两个后端都能跑。

接口刻意做成 **WebGPU `GPUDevice` 的形状**（`Adapter` / `Device` / `Queue` / bind group / 不可变管线 /
command encoder），由 WebGL2 与 WebGPU 两个后端各自实现 —— GL 里不存在的概念（bind group、
pipeline layout、不可变管线）由 WebGL2 后端**模拟**，而不是把差异泄漏给上层。

在此之上还有一个「五行画出东西」的便捷层（`src/gfx`）：声明式 uniform、自动生成 GLSL 与 WGSL、
几何体生成、相机与轨道控制、uniform arena。

```ts
import { Renderer, PerspectiveCamera, OrbitControls, materials, shapes } from '@dxyl/gpu-device-api';

const canvas = document.getElementById('view') as HTMLCanvasElement;

const renderer = await Renderer.create({ canvas, backend: 'auto' });   // 自动选后端，失败自动回退
const camera = new PerspectiveCamera({ position: [0, 1.4, 3.6] });
new OrbitControls(camera, canvas);
renderer.setCamera(camera);

const sphere = renderer.createGeometry(shapes.createSphere({ radius: 0.8 }));
const lambert = renderer.createMaterial(materials.lambert({ color: [1, 0.6, 0.2, 1] }));

// 实际项目里把下面三行放进 requestAnimationFrame 循环
renderer.beginFrame({ color: '#101418' });
renderer.draw(sphere, { material: lambert });
renderer.endFrame();
```

---

## 目录

- [特性](#特性)
- [快速开始](#快速开始)
- [目录结构](#目录结构)
- [core 层](#core-层)
- [便捷层 gfx](#便捷层-gfx)
- [示例与自检](#示例与自检)
- [两个后端的硬约束（踩过的坑）](#两个后端的硬约束踩过的坑)
- [能力边界（诚实清单）](#能力边界诚实清单)
- [开发](#开发)

---

## 特性

- **一个 API，两个后端**：`backend: 'auto' | 'webgl2' | 'webgpu'`；`'auto'` 会真的去请求一次
  adapter 再决定，失败时按可用后端依次回退并说明原因（`strictBackend: true` 可关掉回退）。
- **不静默降级**：两个后端都做不到的事情一律抛 `ValidationError`，并在消息里给出替代方案；
  错误消息统一以 `[gpu-device-api] ` 开头、用英文。宁可早报错，也不要「画面全黑却没有一行日志」。
- **一份描述，两种语言**：`defineUniforms()` 同时算出 GLSL `std140` 与 WGSL uniform 的字节布局、
  并生成两边的块声明；`defineMaterial()` 自动补上 attribute 声明、uniform 块、sampler 与片元输出。
- **着色器样板可控**：GLSL 的 `#version` 替换与精度前言默认自动补齐（WebGPU 的 WGSL 不需要），
  也可以用 `glsl: { version, preamble }` 两项独立关掉 —— 全关就是逐字节透传。见
  [GLSL 的自动包装可以关掉](#glsl-的自动包装可以关掉)。
- **uniform arena + 动态偏移**：修掉「改 uniform → draw → 再改 → 再 draw」在两个后端语义不一致的
  问题（见 [两个后端的硬约束](#两个后端的硬约束踩过的坑)）。
- **实例化与批量的两条路都通**：每实例属性（`stepMode: 'instance'`）一条 draw call 画出上万实例；
  或者每个物体一次 draw call、各自带自己的 model 与 uniform，共用一条管线。见
  [示例与自检](#示例与自检)。
- **带实测数字的性能基准**：`examples/benchmark.html` 只用 core 层（不经过 gfx），在
  2000 / 5000 / 10000 / 20000 / 40000 个图形下跑**真实动态负载**（24 顶点盒子 + 光照着色器，
  每个物体每帧移动并重传矩阵），每档给出「含同步 / 不同步」两轮、静态对照、CPU 与 GPU 同步等待；
  `examples/gfx-benchmark.html` 另外量化便捷层每 draw 的固定开销。见
  [性能基准](#性能基准benchmarkhtml)。
- **可观测**：`device.onError()` 统一上报（WebGPU 的 `onuncapturederror`、WebGL2 的 `getError()`，
  以及本库内部校验失败）；`device.limits` / `device.features` 两个后端都能无差别读取。
- **逃生口**：`device.native` 是原生的 `GPUDevice` 或 `WebGL2RenderingContext`；`examples/smoke.ts`
  就是用它读回 canvas 像素的。
- **自带一套数学库**：`vec2/3/4`、`mat3/4`、`quat`、`euler`、`plane`、`ray`、`box3`、`frustum`、
  `color`、`raycaster`，不依赖设备、可单独 import；`frustum` 直接吃投影视图矩阵做剔除，
  `raycaster` 支持从 NDC 反投影拾取。见 [目录结构](#目录结构)。
- **严格 TypeScript**：`strict` + `noUnusedLocals` + 不使用 `any`；注释用简体中文，技术名词保留英文。

## 快速开始

已发布到 npm（公共包，`@dxyl` scope）：

```bash
npm i @dxyl/gpu-device-api
```

```ts
import { createDevice, BufferUsage, vec3, mat4, quat } from '@dxyl/gpu-device-api';
```

上面这段按**包根**导入：便捷层与 core / shaders / factories 一起由 `src/index.ts` 导出，
`package.json` 的 `exports` 也只声明了 `"."`，所以 `@dxyl/gpu-device-api` 就是唯一入口
（没有 `@dxyl/gpu-device-api/gfx` 这种子路径）。仓库内的示例为了改一行就能看到效果，
按源码路径导入（`./src/index.js`、`./src/gfx/index.js`），两者指向同一份代码。

在仓库里开发：

```bash
pnpm install

pnpm dev          # 启动示例站（vite dev server），打开 /examples/gallery.html
pnpm typecheck    # tsc --noEmit
pnpm test         # vitest run（6 个文件 / 176 条用例，node 环境）
pnpm build        # 产出 dist/gpu-device-api.js（ESM）+ dist/types
pnpm build:demo   # 产出静态示例站到 dist-demo/
```

包入口 `src/index.ts` 导出 **core + shaders + factories + utils** 四层：

```ts
import {
  createDevice, createDeviceWithAdapter, detectBackend,   // factories：后端探测与选择
  BufferUsage, TextureUsage, PrimitiveTopology,            // core：枚举、资源、绑定、管线、通道
  ValidationError,                                         // core：错误类型
  registerShader, compileShaderStage,                      // shaders：源码管理与编译
  mat4, vec3, degToRad, createLogger, disposeAll,          // utils：数学、日志、批量释放
} from '@dxyl/gpu-device-api';
```

便捷层在 `src/gfx/index.ts`，同样从包根导出（示例按源码路径导入）。

## 目录结构

```
src/
├── core/       与后端无关的接口与词汇表：Device、Adapter、CanvasContext、Buffer、Texture、
│               Sampler、ShaderModule、BindGroup(Layout)、PipelineLayout、Render/ComputePipeline、
│               RenderTarget、CommandEncoder、Render/ComputePassEncoder、Queue、Fence、
│               enums/（所有枚举集中）、errors/（GpuError 及各子类）
├── webgl2/     WebGL2 后端：GL program/VAO/状态缓存、纹理单元与 uniform block 分配（TextureUnitAllocator）、
│               framebuffer 缓存、能力探测（glCapabilities）、枚举与格式映射
├── webgpu/     WebGPU 后端：原生对象的一对一包装、管线变体缓存、格式与能力映射、错误通道
├── shaders/    着色器管理：源码注册表、按后端选语言并补样板（GLSL 的 `#version`/精度前言可关，见
│               [GLSL 的自动包装可以关掉](#glsl-的自动包装可以关掉)）、GLSL/WGSL 反射（供 layout: 'auto' 与交叉校验）
├── factories/  后端探测与选择：detectBackend / createDevice / createDeviceWithAdapter / BackendRegistry
├── gfx/        便捷绘制层：Renderer、Geometry、Material、Uniforms、UniformArena、Camera、
│               OrbitControls、shapes、materials、Texture
├── utils/      与后端无关的工具：断言、位标志、TypedArray、id、logger、
│               math（vec2/3/4、mat3/4、quat、euler、plane、ray、box3、frustum、color、raycaster）
└── types/      @webgpu/types 引用与内部共享类型
```

`utils/math` 是独立可用的一层（不依赖设备，可单独 import）：文件名与导出命名空间都是小写 ——
`vec3` / `mat4` / `quat` / `euler` / `plane` / `ray` / `box3` / `frustum` / `color` / `raycaster`。
统一约定是 **out 参数在最前**、运算对象都是 `Float32Array`（`color` 例外，用 `ColorValue` 对象），
所以热路径上不产生临时分配；`euler` / `box3` / `frustum` / `raycaster` 这几类带自身状态的用对象：

```ts
import { vec3, mat4, quat, euler, ray, box3, frustum, color, raycaster } from '@dxyl/gpu-device-api';

// Euler(弧度) → 四元数 → 模型矩阵：每一步都把结果写进已有对象
const q = euler.toQuaternion(quat.create(), euler.set(euler.create(), 0, Math.PI / 4, 0));
const model = mat4.fromRotationTranslationScale(
  mat4.create(), Math.PI / 4, vec3.fromValues(0, 1, 0), vec3.fromValues(0, 1, 0), vec3.fromValues(1, 1, 1),
);

// 射线与盒求交：返回最近的正向命中距离，未命中为 null
const box = box3.setFromCenterAndSize(box3.create(), vec3.create(), vec3.fromValues(1, 1, 1));
const r = ray.set(ray.create(), vec3.fromValues(0, 0, 5), vec3.normalize(vec3.create(), vec3.fromValues(-0.3, -0.2, -1)));
const t = ray.intersectBox(r, box);
const hit = t === null ? null : ray.at(vec3.create(), r, t);

// 视锥剔除 / 拾取：projView 是「投影 × 视图」矩阵
const f = frustum.create();
frustum.setFromProjectionView(f, projView);
const visible = frustum.intersectsBox(f, box);
const rc = raycaster.set(raycaster.create(), vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, -1));
const pickT = raycaster.intersectBox(rc, box);

// 颜色：内部是 0..1 的 RGBA，setStyle 接受 CSS 字符串
const c = color.setStyle(color.create(), '#ff8800');
const linear = color.convertSRGBToLinear(color.create(), c);
```

对应的测试在 `test/math.test.ts`（44 条用例，覆盖退化输入：零长度向量、退化矩阵、gimbal lock、
射线与盒子平行等）。

`docs/需求.md` 保留了最初规划的目录树，可与现状对照。

## core 层

core 是「显式、无魔法」的一层：资源、管线、通道都自己建，但两个后端的写法完全一致。
下面这段与 `examples/smoke.ts` 里 17/17 通过的那段代码同构：

```ts
import { createDeviceWithAdapter, BufferUsage } from '@dxyl/gpu-device-api';

const { device, context, backend } = await createDeviceWithAdapter({
  canvas,
  backend: 'auto',
  contextAttributes: { antialias: false, depth: true },
});
console.info(`实际后端：${backend}`);

/* 着色器：两种语言各给一份，后端只取自己要的那份 */
const module = device.createShaderModule({
  code: { vs: vertexGlsl, fs: fragmentGlsl, wgsl: moduleWgsl },
});

/* 不可变管线：WebGL2 会在创建时立刻编译 program，WebGPU 会在第一次用到某个变体时编译 */
const pipeline = device.createRenderPipeline({
  vertex: {
    module,
    buffers: [
      {
        arrayStride: 24, // position(vec2) + color(vec4) 交织
        attributes: [
          { shaderLocation: 0, offset: 0, format: 'float32x2' },
          { shaderLocation: 1, offset: 8, format: 'float32x4' },
        ],
      },
    ],
  },
  fragment: { module },
  primitive: { topology: 'triangle-list' },
  depthStencil: { format: null },
});

/* 资源 + 上传 */
const vertices = device.createBuffer({
  size: data.byteLength,
  usage: BufferUsage.Vertex | BufferUsage.CopyDst,
});
device.queue.writeBuffer(vertices, 0, data);

/* 一帧：取帧目标 → 编码通道 → 提交 */
const frame = context!.getCurrentFrameTarget();
const encoder = device.createCommandEncoder({ label: 'frame' });
const pass = encoder.beginRenderPass({
  colorAttachments: [{ view: frame.view, loadOp: 'clear', storeOp: 'store', clearValue: [0.05, 0.06, 0.08, 1] }],
});
pass.setPipeline(pipeline);
pass.setVertexBuffer(0, vertices, 0, data.byteLength);
pass.draw({ vertexCount: 3 });
pass.end();
device.queue.submit([encoder.finish()]);
```

几个要点：

- **枚举取值与 WebGPU 位标志一致**（`BufferUsage.Vertex` 就是 `0x0020`），所以两个后端可以互相转发，
  也方便从 WebGPU 代码迁移。
- **`createDeviceWithAdapter` 返回实际选中的后端**，便于日志与自检；`device.native` 是逃生口。
- **管线是「不可变 + 变体」**：`RenderPipeline.resolve({ colorFormats, depthFormat, sampleCount })`
  按渲染目标形态解析出具体状态，同一描述在不同附件组合下会解析成不同变体。
- **画布的 depth attachment 由后端如实给出**：`context.createPassDescriptor()` 返回与
  `RenderTarget.createPassDescriptor()` **同一形状**的附件列表 —— WebGL2 用默认帧缓冲自带的
  深度缓冲（`contextAttributes.depth` 没关掉就有），WebGPU 为 canvas 创建并复用一张同尺寸的
  `depth24plus` texture（尺寸变化时重建，MSAA 时与颜色附件同采样数）。上层（例如 gfx 的
  `Renderer`）因此可以用同一段代码处理「画到 canvas」与「画到离屏目标」，不会有一条路径
  悄悄丢掉 depth attachment（丢掉之后后端会如实关掉 `DEPTH_TEST`，画面退化成画家算法）。
- **`device.onError(cb)`** 注册错误回调（返回取消订阅的函数）；`device.reportError(err)` 主动上报。
- **调试标记**：`CommandEncoder` / `RenderPassEncoder` / `ComputePassEncoder` 都有
  `pushDebugGroup(label)` / `popDebugGroup()` / `insertDebugMarker(label)`，抓帧工具（RenderDoc、PIX）据此分组。
  WebGPU 直接转发原生调用；WebGL2 走 `EXT_debug_marker`，**扩展不可用时是空操作**（只影响抓帧分组，
  不影响渲染结果，所以没必要抛错）。

### GLSL 的自动包装可以关掉

WebGL2 需要 `#version 300 es` 与精度声明，而 WebGPU 的 WGSL 不需要，所以**默认**情况下
GLSL 侧会替你补上这两件事：剥掉你写的 `#version` → 首行注入 `#version 300 es` → 拼接默认精度前言
→ 拼接 `defines` → 你的源码。想自己掌控（源码已由别的工具预处理、或要精确控制行号）就用
`glsl` 选项，两项**独立**开关、默认都开：

```ts
device.createShaderModule({
  code: { vs, fs },
  glsl: {
    version: false,     // 不碰 #version：不注入、不校验、不删除（版本行你自己写）
    preamble: false,    // 不拼精度前言；也可以传字符串换成自定义前言
  },
});
```

| 选项 | 默认 | `true`（默认行为） | `false` |
| --- | --- | --- | --- |
| `version` | `true` | 剥掉你写的 `#version`，首行注入 `#version 300 es`；写的不是 300 es 直接报错 | `#version` 原样保留（有则仍在第一位，前言/`defines` 插到它后面），不校验版本 |
| `preamble` | `true` | 拼接 `GLSL_PRECISION_PREAMBLE`（`precision highp float;` 等） | 不拼；传字符串则替换成你的前言 |

几条容易踩的：
- **两项都关掉且没有 `defines` 时是逐字节透传**，连首尾空白都不动（`wrapGlslSource` 直接返回原串）；
  有 `defines` 时仍会注入宏，且一定排在 `#version` 之后。
- **关掉 `version` 后不再有兜底**：不写 `#version` 会被后端按 GLSL ES 1.00 编译而报错；
  写 `#version 310 es` 之类也会由后端报编译错误（默认路径是库先报 `ValidationError`，信息更清楚）。
- **片元着色器关掉 `preamble` 要自己写 `precision`**：GLSL ES 3.00 里片元着色器没有默认浮点精度。
- 只影响 WebGL2 后端；WGSL 没有版本指令与精度前言，WebGPU 后端会保存这个选项但不使用。
- `GLSL_PREAMBLE`（版本 + 精度）与新的 `GLSL_PRECISION_PREAMBLE`（只精度）、
  `GLSL_VERSION_DIRECTIVE`（只版本）都从包入口导出，`resolveGlslWrapOptions()` 可以看到归一化结果。

## 便捷层 gfx

`gfx` 的目标是「日常绘制短到五行」，它内部只用 core 的 `Device` / `CommandEncoder` /
`RenderPassEncoder`，但替使用者处理掉了几件必须做对的事：管线按材质缓存、顶点缓冲槽位映射、
uniform 的每 draw 独立区间、bind group 缓存、相机矩阵与深度约定。

### Renderer

```ts
const renderer = await Renderer.create({
  canvas,                       // HTMLCanvasElement | OffscreenCanvas
  backend: 'auto',              // 'auto' | 'webgl2' | 'webgpu'
  antialias: true,
  depth: true,                  // 画布路径的 depth attachment；WebGPU 会据此建一张 canvas 深度纹理
  sampleCount: 4,               // canvas MSAA：WebGPU 生效；WebGL2 传 >1 直接抛错（不静默忽略）
  clearColor: '#0b0e13',
  pixelRatio: 1,                // 省略时跟随设备像素比
  camera,                       // 可稍后 setCamera
  contextAttributes: { depth: true },   // WebGL2 的 context 属性逃生口（逐字段覆盖上面推导出的默认值）
});

renderer.resize();                                     // 按 CSS 尺寸同步后备缓冲
renderer.beginFrame({ color: '#101418' });             // 也可以 { target } 画进离屏 RenderTarget
renderer.setMaterial(material);
renderer.draw(geometry, {
  model: mat4.create(),                                // 省略即单位矩阵
  uniforms: { baseColor: [1, 0.6, 0.2, 1] },           // 只写本次 draw 独占的那段 arena
  textures: { albedo: texture },
  count: 36, first: 0, instances: 1,
});
renderer.endFrame();
renderer.stats;                                        // drawCalls / triangles / pipelineSwitches / frameTime
renderer.destroy();
```

- `beginPass()` 可以在同一帧里再开一个通道（画到另一个目标，或做后处理）。
- `draw()` 会自动 `geometry.validateAgainst(material.attributes)`：缺属性、格式不符、或者
  **步进模式（vertex / instance）与数据不一致**，都会立刻报错。
- `drawInstanced(geometry, n, options)` 是 `draw(..., { instances: n })` 的简写。
- `stats.pipelineSwitches` 统计的是**真正的切换**（相邻两次 draw 用了不同管线才计数）：
  同一个材质连续画 N 个物体，它是 1 而不是 N。
- `depth: false` 时画布通道不带 depth attachment，深度测试会被（正确地）关掉；`sampleCount`
  只有 WebGPU 的 canvas 生效（WebGL2 的 canvas 采样数由 `antialias` 决定，传 `> 1` 会直接抛
  `ValidationError`，不会静默忽略）。见 [画布深度测试的回归页](#示例与自检)。
- **相机矩阵每帧只算一次**（`beginFrame()` 里刷新），所以 `draw()` 的固定开销里没有相机数学。
  在帧中间改了相机参数（`position` / `target` / `fov` …）想立刻生效，就自己调一次
  `renderer.updateCamera()` —— 否则改动会在下一帧的 `beginFrame()` 才反映出来。

### Geometry

几何体按属性**分开存**（一个属性一个 buffer），因此顶点布局只由**材质**决定：
一个材质对应一条管线，几何体多带几个用不到的属性也无所谓。

```ts
const geometry = renderer.createGeometry({
  label: 'quad',
  position: new Float32Array([...]),      // 标准属性名可自动推断格式
  normal: new Float32Array([...]),
  uv: new Float32Array([...]),
  indices: new Uint16Array([0, 1, 2]),
  topology: 'triangle-list',
});

geometry.vertexCount;    // 只由「按顶点步进」的属性推断
geometry.indexCount;     // 0 表示非索引绘制
geometry.instanceCount;  // 实例属性提供多少份实例数据；没有实例属性时为 null
```

实例化数据写在 `attributes` 里，用 `perInstance: true` 标记 —— 这时它的元素个数**不必**等于顶点数：

```ts
const instanced = renderer.createGeometry({
  position: box.position,                          // 24 个顶点
  normal: box.normal,
  indices: box.indices,                            // 36 个索引
  attributes: {
    // 4096 份实例数据：每个实例读一次
    instanceOffset: { data: offsets, format: 'float32x3', perInstance: true },
    instanceColor: { data: colors, format: 'float32x4', perInstance: true },
    instanceScale: { data: scales, format: 'float32', perInstance: true },
  },
});
```

标准属性名与默认格式：`position`/`normal` → `float32x3`、`uv`/`uv1` → `float32x2`、
`color`/`weights` → `float32x4`、`joints` → `uint16x4`。其它属性名必须显式给 `format`。

### Material

```ts
const lambert = defineMaterial({
  name: 'lambert',
  attributes: { position: 'float32x3', normal: 'float32x3' },   // 声明顺序即 shaderLocation
  uniforms: { projectionView: 'mat4x4f', model: 'mat4x4f', baseColor: 'vec4f', lightDirection: 'vec3f' },
  glsl: {
    vs: `out vec3 vNormal;
         void main() {
           vNormal = u.normalMatrix * normal;                    // 属性名与 u.* 直接可用
           gl_Position = u.projectionView * u.model * vec4(position, 1.0);
         }`,
    fs: `in vec3 vNormal;
         void main() { fragColor = u.baseColor; }`,              // fragColor 自动声明
  },
  wgsl: `@vertex fn vsMain(v: VertexInput) -> @builtin(position) vec4f { ... }`,
  defaults: { baseColor: [1, 1, 1, 1] },
  blend: 'alpha', cullMode: 'back', depthTest: true,
  dynamicUniforms: true,                                          // 默认走 arena 动态偏移
});
```

实例化属性在材质这一侧写成 `{ format, stepMode: 'instance' }`（必须与几何体的 `perInstance` 一致），
之后它就和普通属性一样在着色器里按名字使用：

```ts
const instanced = defineMaterial({
  name: 'instanced',
  attributes: {
    position: 'float32x3',
    normal: 'float32x3',
    instanceOffset: { format: 'float32x3', stepMode: 'instance' },
    instanceColor: { format: 'float32x4', stepMode: 'instance' },
    instanceScale: { format: 'float32', stepMode: 'instance' },
  },
  // ... uniforms / glsl / wgsl
});

renderer.drawInstanced(geometry, 4096, { model });   // 一次 draw call 画出 4096 个实例
```

- `glsl` 分 vs / fs，`wgsl` 是**一个模块**（含顶点与片元两个入口），因为
  `createShaderModule` 本来只接受一份代码。
- 自动注入：GLSL 的 `layout(location = N) in ...`、`layout(std140) uniform ... { } u;`、
  `uniform sampler2D`、以及片元输出 `fragColor`（可用 `fragmentOutput` 改名或关掉）。
- 注入位置可用占位符常量控制：`UNIFORM_PLACEHOLDER` / `ATTRIBUTE_PLACEHOLDER` /
  `TEXTURE_PLACEHOLDER`（定义在 `src/gfx/Material.ts`，是三个形如注释的占位符）；
  不写占位符时整体前置。
- 内置材质在 `materials` 命名空间：`lambert` / `phong` / `unlit` / `normalDebug` /
  `vertexColorLine` / `flatLine`，用法如 `materials.lambert({ color })`。

### Uniforms

一份描述同时产出**字节布局**与**两种语言的声明**，所以不会出现「布局和 shader 对不上」：

```ts
const layout = defineUniforms({
  projectionView: 'mat4x4f',
  model: 'mat4x4f',
  normalMatrix: 'mat3x3f',
  baseColor: 'vec4f',
  lightDirection: 'vec3f',
  time: 'f32',
  bones: 'mat4x4f[64]',
});

layout.byteLength;         // 总字节数（16 的倍数）
layout.describe();         // 逐字段打印偏移，排查布局问题用
layout.glslDeclaration();  // layout(std140) uniform Uniforms { ... } u;
layout.wgslDeclaration();  // struct Uniforms { ... } 加 @group(0) @binding(0) var<uniform> u: Uniforms;

const u = createUniforms(layout);   // 字段可直接当属性访问，也可以 u.set('time', 1)
u.model.set(m4);                    // 紧凑字段就是 Float32Array，可直接 set
u.time[0] = 1;                      // 标量字段是 TypedArray(1)
u.set('bones', boneMatrices);
```

布局规则取 **GLSL `std140` 与 WGSL uniform 地址空间的交集**：`vec3` 对齐 16、大小 12；矩阵按列
（`mat3x3f` 每列补齐到 16 字节，所以不是紧凑内存）；数组元素步长取整到 16 的倍数；块大小取整到 16。
`mat2x2f` 等非 4 列矩阵在两种规范下不一致，因此**直接拒绝**并提示改用 `mat4x4f`。

### UniformArena

为什么必须要有它：`queue.writeBuffer` 在 WebGPU 上是**提交时**生效，而在 WebGL2 上是**立即**生效。
「改 uniform → draw → 再改 → 再 draw」这个最自然的写法在 WebGPU 上会让前面所有 draw 都读到最后一个
物体的矩阵。arena 给每次 draw 分配**互不重叠**的 256 字节对齐区间，并用动态偏移绑定，于是无论写入
何时落地，每个 draw 都读到自己那一段 —— 两个后端结果完全一致。容量不够时 arena 会扩容，
并把本帧已写过的内容重放到新 buffer 上（对调用方透明）。

### Camera / OrbitControls / Texture

- `PerspectiveCamera` / `OrthographicCamera`：`update()` 同时算出 `projectionMatrixGL`（z ∈ [-1, 1]）
  与 `projectionMatrixZO`（z ∈ [0, 1]），`depthRange` 决定 `projectionMatrix` 暴露哪一套；
  `Renderer` 会按后端自动设置它（WebGPU 用 `'zo'`），所以同一个相机对象换后端不用重建。
- `OrbitControls`：`new OrbitControls(camera, canvas)`，支持 `enableDamping`、`reset()`。
- `GfxTexture`：`renderer.createTexture({ data, width, height, mipmaps, ... })`，`data` 可以是原始像素
  或浏览器图像来源（`ImageBitmap` / `HTMLImageElement` / `canvas` / `VideoFrame` …）。材质声明了纹理
  而 `draw()` 没给时，会绑一张 1×1 白色占位纹理 —— 「忘了传纹理」的表现是白色，而不是未定义数据。

## 示例与自检

| 页面 | 内容 |
| --- | --- |
| `examples/gallery.html` | **示例汇总**：所有示例的分类索引（core 层 / gfx 层），含每个页面的说明与查询参数 |
| `examples/index.html` | gfx 层的完整 demo：lil-gui 调参、切换后端、几何体/材质/光照切换 |
| `examples/instancing.html` | **实例化**：一个网格 + 每实例数据（位置/颜色/缩放），**1 次 draw call 画 4096 个实例** |
| `examples/batch.html` | **批量**：每边 N 个盒子共 N³ 次 draw call，每次带自己的 model 与 uniform，共用 1 条管线 |
| `examples/benchmark.html` | **性能基准（core 层）**：box + 光照着色器的**动态**场景，2000 / 5000 / 10000 / 20000 / 40000 个图形每帧移动并重传矩阵；含静态对照与「含同步 / 不同步」两轮 |
| `examples/gfx-benchmark.html` | **性能基准（gfx 层）**：同样的档位测 `renderer.draw()` 的每 draw 固定开销（相机 uniform、model、法线矩阵、uniform arena + 动态偏移、逐属性顶点绑定） |
| `examples/smoke.html` | core 层的浏览器内冒烟测试：17 项检查，含像素级断言（canvas 中央、离屏目标角落）与 GLSL 包装开关 |
| `examples/depth.html` | **画布深度测试回归**：近红先画、远绿后画，中心像素必须是红 —— 两个后端各自一遍，读回的也是 canvas 本身 |

**core 层示例**（同样只用 `src/index.ts`，**不经过 gfx 便捷层**，用来对照「便捷层到底替你做了什么」）：

| 页面 | 内容 |
| --- | --- |
| `examples/core-triangle.html` | 最小的一次绘制：交织顶点缓冲、`layout: 'auto'`，没有 uniform / bind group |
| `examples/core-box.html` | 3D 必备件：投影与视图矩阵、uniform 块的字节打包、bind group layout、带深度的管线 |
| `examples/core-texture.html` | `createTexture` + `queue.writeTexture` + `createSampler`；sampler 按 `<纹理名>_sampler` 配对 |
| `examples/core-instancing.html` | 每实例属性（`stepMode: 'instance'`）：1 次 draw call 画 N 个实例，`?count=` 调数量 |
| `examples/core-batch.html` | N 次 draw call + **动态偏移** uniform（`hasDynamicOffset` + `setBindGroup(1, bg, [offset])`） |

这五个页面共用 `examples/core-shared.ts`（设备创建、离屏像素自检、帧循环、uniform 绑定等样板），
每个页面的 `.ts` 顶部注释都写明了它要演示什么、以及对应的 core API 调用点。
它们也会把结论写进 `data-<名字>-lit / -pixel / -distinct / -error`。

**实例化 vs 批量**（两组示例正好是一对）：

| | 实例化（`instancing.html`） | 批量（`batch.html`） |
| --- | --- | --- |
| draw call | 1（与实例数无关） | 每个物体 1 次 |
| 差异放在哪 | 顶点缓冲里的**每实例属性**（`stepMode: 'instance'`） | `draw()` 的 `model` 与 `uniforms`（走 arena 动态偏移） |
| 适合 | 同一网格的海量副本（草、粒子、体素） | 物体各自有独立参数/材质变体，数量在千级以内 |
| 上限 | 实例数可以上万 | 受 draw call 与 uniform 带宽限制 |

四个页面都支持 `?backend=webgl2|webgpu|auto`；`instancing.html` 另支持 `&count=`、`batch.html` 支持 `&side=`、
`benchmark.html` 支持 `&mode=instanced|draws&frames=&counts=`；前三个都支持 `&verify=1`。加 `verify=1` 会额外把
场景画进一张离屏目标并读回像素（复用 `examples/offscreen-verify.ts`），把结论写在 `<html>` 的 `data-*` 上：

- `index.html` → `data-demo-pixel / -pixel-corner / -pixel-lit / -error`
- `instancing.html` → `data-instancing-backend / -count / -drawcalls / -instances / -pixel / -lit-pixels / -distinct / -lit / -error`
- `batch.html` → `data-batch-backend / -items / -drawcalls / -pipeline-switches / -pixel / -lit-pixels / -distinct / -lit / -error`
- `benchmark.html` → `data-benchmark-backend / -adapter / -mode / -frames / -results / -done / -lit / -error`
  （`-results` 是 `2000:frame=6.35ms,fps=157.5,cpu=0.41ms,draws=1,tris=16000;…` 这样的紧凑串）

其中 `-lit` 的判据不只是「有像素被光栅化」，还要求画面上出现**多种颜色**：只剩一种颜色通常意味着
每实例数据没生效、或者每次 draw 的 uniform 串到了同一段内存（这两个后端的两种典型故障）。

### 画布深度测试的回归（`depth.html`）

`examples/depth.html` 专门盯住一个容易静默失效的点：**画进 canvas 的渲染通道有没有 depth attachment**。
没有它，两个后端都会如实关掉 `DEPTH_TEST`（WebGL2 的 `resolveRenderState()`、WebGPU 的 pipeline
variant 都按「这个 pass 没有深度」处理），画面看起来只是「后面的盖住前面的」—— 这正是画家算法。

页面画两次，每次读回 canvas 中心像素（WebGL2 用 `readPixels`，WebGPU 用 `copyTextureToBuffer`）：

1. **对照**：只画远处的绿四边形 → 中心必须是绿（证明读回链路本身有效，绿确实被光栅化了）；
2. **遮挡**：先画近处红四边形、再画远处绿四边形，两个材质都 `depthTest: true` → 中心必须是**红**。

`?backend=webgl2|webgpu|auto` 选后端（一个 canvas 只能绑定一种 context，所以一次跑一个后端）。
结论写在 `<html data-depth-result="pass|fail">`，另外有
`data-depth-backend / -pixel / -control-pixel / -corner-pixel / -format / -error`，
其中 `-format` 是 `context.createPassDescriptor()` 如实报出的画布深度格式（`depth24plus`；没有就是 `none`）。

### 性能基准（`benchmark.html`）

这个页面**只用 `src/index.ts`**（core + factories + utils）：着色器、顶点/实例缓冲、uniform 块的字节打包、
bind group、管线、通道、提交与 GPU 同步全部手写 —— 可以当成「不带便捷层时这个库长什么样」的参考。
它对 2000 / 5000 / 10000 / 20000 / 40000 个图形逐档测量，两种模式：

- `instanced`（默认）：1 次 draw call 画 N 个图形；
- `draws`：每个图形一次 draw call（用 `setVertexBuffer` 的偏移指向自己那份实例数据），
  单帧探测超过 500ms 就跳过该档，避免把页面卡死。

计时口径：每档先空跑几帧热身，再逐帧 `performance.now()`，并且**等到这一帧真的画完才停表** ——
WebGPU 用 `queue.onSubmittedWorkDone()`；WebGL2 用一次 1×1 的 `readPixels` 强制同步，因为
**`gl.finish()` 在 WebGL 里并不保证 GPU 已完成**（规范只要求把命令送出去，实测在 ANGLE 上几乎立即返回，
那样测到的只是 CPU 录制时间，而且驱动队列会越积越多、数字完全不可比）。
`cpu` 列是「录制 + 提交」，`frame` 列是「从开始录制到画完」。

本机实测（同一份代码，两行是同一台机器上的两个后端）。负载是**真实动态场景**：24 顶点/36 索引的盒子
（position + normal + uv，12 个三角形）+ 方向光/半球环境光的片元着色器，每个物体**每帧都在动** ——
每帧重算 40000 个 model 矩阵并重新上传（实例化 64 B/物体、draws 模式 256 B/物体，40000 个 ≈ 2.56 MB/帧）。

| 图形数 | WebGL2 / SwiftShader 帧耗时（含同步） | WebGL2 CPU（不同步） | WebGPU / Intel 帧耗时（含同步） | WebGPU CPU（不同步） | WebGPU GPU 同步等待 |
| --- | --- | --- | --- | --- | --- |
| 2000 | 45.8 ms | 3.60 ms | 11.8 ms | 2.64 ms | 9.4 ms |
| 5000 | 104.9 ms | 5.92 ms | 11.0 ms | 5.82 ms | 4.7 ms |
| 10000 | 209.2 ms | 23.82 ms | 16.3 ms | 12.04 ms | 5.0 ms |
| 20000 | 414.6 ms | 25.27 ms | 27.4 ms | 21.47 ms | 5.9 ms |
| 40000 | 826.8 ms | 45.93 ms | 55.8 ms | 43.70 ms | 11.1 ms |

几点必须说清楚，否则很容易误读：

1. **CPU 侧不再可以忽略。** 在真实 GPU 上 40000 个物体时，纯 CPU（重算矩阵 + 上传 2.56 MB + 录制 + 提交）
   是 43.7 ms，而整帧 55.8 ms —— 同一量级。旧的「静态纯色三角形」基准测不到这部分（那时 CPU 只有几毫秒），
   这正是它容易让人误判的地方：**场景一动，瓶颈结构就变了。**
2. **软件光栅化与真实 GPU 差 1～2 个数量级**，所以页面会把 adapter 名字写进 `data-benchmark-adapter`，
   看到 `SwiftShader` 就别把 FPS 当真实性能（上面 WebGL2 那一列是软件光栅化的数字）。
3. **「含同步」列把 CPU/GPU 串行化了，帧时间偏悲观**；小档位上 `Δ帧` 甚至可能为负（这一帧的 CPU 矩阵计算
   与上一帧的 GPU 工作重叠）。要看「让物体动起来」的代价，请看页面同时给出的**静态对照**与 `ΔCPU`。
4. `draws` 模式（每物体一次 draw call）与 `instanced`（1 次 draw call）的差距仍然很大，
   印证「实例化省的是 draw call 与 CPU 提交」。

便捷层（`src/gfx`）的每 draw 成本是另一个页面：`examples/gfx-benchmark.html` —— 它逐档测
`renderer.draw()` 的固定开销（相机 uniform、每 draw 的 model、法线矩阵、uniform arena + 动态偏移、
逐属性绑定顶点缓冲）。它当初就是靠 40000 档把 `UniformArena` 的一个真实缺陷（扩容时在录制中途销毁旧 buffer，
WebGPU 会在 submit 时报 `used in submit while destroyed`）逼出来的。

⚠️ 跑这个页面**不要加 `--virtual-time-budget`**：虚拟时间会让 `performance.now()` 跟着跳，
测出来的数字没有意义（无头环境请用真实时间等它跑完，页面会把进度写进 `data-*` 与 `#progress`；
本仓库用 `scripts/verify-headless.mjs` 按真实时间轮询 `data-*` 结论）。

`examples/index.html` 的查询参数：`?backend=webgl2|webgpu|auto&shape=box&material=unlit&grid=0&verify=1`。
`verify=1` 的结果写在 `<html data-demo-pixel / data-demo-pixel-corner / data-demo-pixel-lit / data-demo-error>` 上 ——
这是**后端无关**的像素级自检（绘制走 gfx、读回走 core 的 `copyTextureToBuffer`）。

无头 Chrome 跑这些页面（本仓库实际使用的配方）：

```powershell
$chrome = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
$base = 'http://localhost:5199'   # 与 dev server 输出保持一致（pnpm exec vite --port 5199）

# WebGL2：软件光栅化，稳定可复现；--dump-dom 就够（同步绘制，load 之前结果已经写好）
Start-Process $chrome -NoNewWindow -Wait -RedirectStandardOutput "$env:TEMP\dom.html" -ArgumentList @(
  '--headless=new','--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader',
  '--virtual-time-budget=25000',"--user-data-dir=$env:TEMP\chrome-webgl2",'--dump-dom',
  "$base/examples/smoke.html")

# 两个后端通用：用 CDP 在**真实时间**里轮询页面的 data-*（WebGPU 必须这样，见下面第 2 条）
node scripts/verify-headless.mjs --chrome $chrome --wait depthResult `
  --url "$base/examples/depth.html?backend=webgl2" `
  -- --use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader
node scripts/verify-headless.mjs --chrome $chrome --wait depthResult `
  --url "$base/examples/depth.html?backend=webgpu" -- --enable-unsafe-webgpu
```

`--dump-dom` 时结论在 dump 出来的 HTML 的 `<html>` 上：`data-smoke-result="pass"`、
`data-demo-pixel-lit="true"`、`data-demo-error`（为空表示启动没报错）。
`benchmark.html` 与带 `verify=1` 的 `instancing.html` / `batch.html` 也各自把结论写在同一处。
`scripts/verify-headless.mjs` 则直接打印 `data-*` 与页面里的 `#out` 文本，结论是 `fail` / `false`
或超时时退出码为 1，方便串进 CI 之类的脚本。

四个踩过的坑，写在这里省得重复踩：

1. **不要同时加 `--use-angle=swiftshader` 与 `--enable-unsafe-webgpu`** —— 这个组合下
   `requestAdapter()` 会返回 null；测 WebGPU 时去掉 GL 的软件光栅化开关，测 WebGL2 时再加回来。
2. **`--virtual-time-budget` 会抢跑 WebGPU 的异步返回**（虚拟时间瞬间耗尽，GPU 回调还没到）；
   而且**模块里的顶层 await 也不会推迟 load 事件**（实测），所以 `--dump-dom` 对 WebGPU 页面
   基本抓不到结论。要测 WebGPU 就用 `scripts/verify-headless.mjs`（CDP + 真实时间轮询）。
3. **性能基准绝对不能加 `--virtual-time-budget`**：虚拟时间会让 `performance.now()` 跟着一起跳，
   测出来的帧耗时没有意义。请让页面在真实时间里跑完（它会自己把结果写进 `data-benchmark-*`）。
4. **Chrome 是 GUI 子系统程序**，`& $chrome ...` 抓不到 stdout，必须用
   `Start-Process -RedirectStandardOutput`（`scripts/verify-headless.mjs` 走的是 CDP，不受这条影响）。

## 两个后端的硬约束（踩过的坑）

这些是「上层写一份代码」时最容易被忽略、却会让画面悄悄变空的地方，代码里都有对应的拦截或注释：

**① WebGL2：一个 buffer 的绑定目标在首次绑定时永久确定。**
绑过 `COPY_WRITE_BUFFER` 的 buffer 之后不能再绑 `ELEMENT_ARRAY_BUFFER`（反之亦然，解绑也不算数）。
所以索引缓冲必须在创建时就声明 `BufferUsage.Index`，`WebGL2Buffer` 也是据此在创建时定死目标的：
声明了 `Index` 走 `ELEMENT_ARRAY_BUFFER`，其余走 `COPY_WRITE_BUFFER`；把索引缓冲当顶点缓冲用
（或反过来）会被明确拒绝，而不是静默画不出东西。

**② WebGPU：`setBindGroup` 必须真的带上动态偏移。**
布局里声明了 `hasDynamicOffset` 的 entry，`setBindGroup(index, bindGroup)` 后面那个偏移数组是
**必须**的；漏传会让整条 command buffer 失效，报错却出现在 `queue.submit` 上
（`Invalid CommandBuffer ... due to a previous error`），非常难定位。arena 方案依赖这一点。

**③ `queue.writeBuffer` 的时序差异。**
WebGPU 提交时生效、WebGL2 立即生效。**不要在同一帧内对同一 buffer 的同一区间写两次再分别 draw**；
需要这种写法就用 arena + 动态偏移（上面 ②①就是这条链路的两个后端实现）。

**④ WebGPU 的 usage 组合与可拷贝格式是有约束的。**
例如 `MapRead` 只能与 `CopyDst` 组合（`MapRead | CopySrc` 非法）；`depth24plus` 的内存布局是
实现定义的、不能作为 `CopySrc`，要读回深度就用 `depth32float`。WebGL2 后端不校验这些，
所以「在 WebGL2 上跑得通」不代表 WebGPU 也通。

**⑤ 一张 canvas 只能绑定一种 context 类型。**
已经 `getContext('webgl2')` 过的 canvas 再 `getContext('webgpu')` 一定返回 null，
`destroy()` 也解不开。**切换后端必须换一张 canvas 元素**（demo 里的 `replaceCanvas()` 就是干这个的）。

**⑥ WebGL2 的 `gl.finish()` 不是「等 GPU 做完」。**
WebGL 规范只要求它把命令送出去；实测在 ANGLE/SwiftShader 上几乎立即返回。
要真的等到这一帧画完（例如做性能测量），得用一次 1×1 的 `readPixels` 强制同步 ——
`benchmark.html` 就是这么做的（走 `device.native` 逃生口）。

**⑦ `queue.writeBuffer` 的 `dataOffset` / `size` 单位是「字节」。**
WebGPU 原生按字节算，WebGL2 的 `bufferSubData` 也按字节算，但早期实现里 WebGPU 后端误按
元素个数转发，于是同一份代码在 WebGL2 上正确、在 WebGPU 上偏移错位或报
`Number of bytes to write is too large`。现在两个后端统一按字节解释：内部按
`BYTES_PER_ELEMENT` 换算（`DataView` 按 1 字节），不是整元素倍数时直接抛 `ValidationError`，
而不是让数据悄悄错位。写 `Float32Array` 时记得 `offset * 4`。

**⑧ WebGPU 的 `copyTextureToBuffer` 要求 `bytesPerRow` 是 256 的倍数。**
想读回一张纹理做像素断言时，宽 96、RGBA8 的图按 384 字节/行会被拒绝
（`bytesPerRow (384) is not a multiple of 256`）。做法是向上取整到 256 的倍数、
再把每行前 `width * 4` 字节搬到紧凑缓冲里（`core-shared.ts` / `offscreen-verify.ts` 里的
`verifyOffscreen` 就是这套；WebGL2 的 `readPixels` 没有这个限制，所以只有 WebGPU 会暴露）。

## 能力边界（诚实清单）

**WebGL2 后端不支持（创建/调用时明确抛错，附带替代方案）**

| 能力 | 说明 |
| --- | --- |
| compute pipeline / compute pass | 需要 GLES 3.1，WebGL2 只有 GLES 3.0 |
| storage buffer / storage texture | 同上，请改用 uniform buffer 或「渲染到纹理 + 采样」 |
| 间接绘制 `drawIndirect` / `drawIndexedIndirect` | 请把参数读回 CPU 再提交 |
| `firstInstance` / `baseVertex` | 缺少对应的 GL 入口；请把数据前移或把偏移加进索引 |
| 绑定时的 mip 子范围视图 | mip 范围是纹理对象自身的状态，请为需要的 mip 单独建纹理 |
| 多重采样的离屏渲染目标 | GL 的多重采样只能渲染到 renderbuffer，无法 resolve 成纹理 |
| 1D 纹理 | 请改用高度为 1 的 2D 纹理 |
| 只有深度、没有片元着色器的管线 | GL 的 program 必须同时链接两个阶段 |
| `rgb9e5ufloat` 等格式 | 给出替代格式 |

**还没做**

- GLSL ↔ WGSL **自动转译**：需求里列为可选，目前不实现（`src/shaders/index.ts` 的说明写了原因）——
  转译器要覆盖的语法面太大，与其做一个半可靠的转译器，不如两种语言各写一份、由编译期校验兜住错误。
- WebGL2 的 `firstInstance` / `baseVertex` / 间接绘制（见上表）。
- 便捷层 `gfx` 没有单独的包入口（子路径）：它和 core 一起从包根导出，`exports` 只有 `"."`
  （见 [快速开始](#快速开始)）。
- `docs/需求.md` 里标注「第二阶段」的 query set / fence 等，WebGPU 侧已实现一部分，
  WebGL2 侧按能力可用性抛错。

## 开发

### 命令

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | 启动 vite dev server（示例站在 `/examples/`） |
| `pnpm typecheck` | `tsc --noEmit`（`src`、`examples`、`test`、配置文件全都在检查范围内） |
| `pnpm test` / `pnpm test:watch` | vitest（node 环境） |
| `pnpm build` | `vite build` + `tsc -p tsconfig.build.json`（声明文件）+ `scripts/postbuild.mjs` |
| `pnpm build:demo` / `pnpm preview` | 构建 / 预览静态示例站 |
| `node scripts/verify-headless.mjs` | 无头 Chrome + CDP 轮询页面的 `data-*` 结论（WebGPU 页面用它，见[无头配方](#示例与自检)） |
| `node scripts/verify-comments-only.mjs` | 校验「本次改动只动了注释」 |

### 测试构成

`test/` 下 6 个文件、176 条用例，全部跑在 **node** 环境（不需要浏览器）：

| 文件 | 覆盖 |
| --- | --- |
| `test/gfx.test.ts` | uniform 布局与代码生成、`Material` 声明注入、`Geometry` 数据打包与校验、实例化属性 |
| `test/shaders.test.ts` | 源码注册表、按后端选语言、GLSL 包装开关（`#version`/精度前言）、GLSL/WGSL 反射 |
| `test/math.test.ts` | 向量 / 矩阵 / 四元数 / Euler / Plane / Ray / Box3 / Frustum / Color / Raycaster（含退化输入） |
| `test/enums.test.ts` | 枚举取值与位标志 |
| `test/utils.test.ts` | 断言、TypedArray、位标志、logger |
| `test/factories.test.ts` | 后端探测、回退与错误路径 |

**像素级**的验证放在浏览器里，入口是 `examples/gallery.html`（汇总页，列出下面全部示例）：
`examples/smoke.html`（core 层 17 项）、`examples/index.html?verify=1`（gfx 层）、
`examples/depth.html?backend=webgl2|webgpu`（gfx 画布路径的深度测试：近红远绿 → 中心必须是红）、
`examples/instancing.html?verify=1` / `examples/batch.html?verify=1`（实例化与批量各自的像素自检），
以及 `core-*.html` 五个 core 层示例（`?verify=1` 会打印像素结论）。
改动渲染路径后请都跑一遍，两个后端都要看（`node scripts/verify-headless.mjs` 能把结论抓成退出码）。

### 代码约定

- TypeScript `strict`，**不使用 `any`**；`import` 一律带 `.js` 后缀。
- **注释用简体中文**，技术名词保留英文（buffer、pipeline、uniform、arena、bind group 等）；
  块注释里不要出现会提前结束注释的字符组合。
- **错误消息用英文**，并以 `[gpu-device-api] ` 开头；错误类型统一用 `core/errors` 里的
  `ValidationError` / `OutOfMemoryError` / `DeviceLostError`（都继承 `GpuError`）。
- 新增后端能力时，**先在 `src/core` 里定接口**，再让两个后端实现；「做不到」要在后端里抛错
  并说明替代方案，不要静默忽略。
- 调试用的临时页面 / 脚本用完就删，不要留在仓库里。
- `node scripts/verify-comments-only.mjs [基线]` 可以校验「本次改动只动了注释」，
  适合纯文档整理后的自检。

### 性能与调试提示

- WebGL2 后端有 `GlStateCache`（跳过多余的 `gl.*` 状态设置）、`ProgramCache`（按最终源码缓存
  program）、按 `(布局, 顶点缓冲组合, 索引缓冲)` 缓存 VAO；WebGPU 后端按渲染目标形态缓存管线变体。
- `createDevice({ debug: true })` 会打开开销较大的额外校验（WebGL2 侧会轮询 `getError()`）。
- `setGlobalLogLevel()` / `createLogger(name)` 控制日志级别；默认是 `warn`，也就是只输出警告与错误，
  需要细节时把级别调到 `debug`（`device.native` 上的一切仍按原生后端自己的规则输出）。
