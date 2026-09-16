# 批 14：打包入口拆分 —— 第一步测量（可复现证据）

> 本目录是批 14 独占的临时目录（`.tmp-14/`，被 `.gitignore` 的 `.tmp-*/` 忽略；
> 本目录里的**测量脚本与消费方探针入库**，`libdist/`、`libmodules/`、`*.log` 不入库）。
> 仓库的 `dist/` **全程未被写入**：本批所有构建都重定向到 `.tmp-14/`。

## 要回答的问题

一个**只用 WebGL2** 的使用方，是否已经被迫把整个 WebGPU 后端打进自己的 bundle？

## 方法（可判定，不靠体积猜）

1. **对照组**：`consumers/core-webgl2.ts`（C1）与 `consumers/all-backends.ts`（C3）
   **逐行相同**，只差 `createDevice({ backend: 'webgl2' })` / `{ backend: 'auto' }` **一处字符串**。
   另外 `consumers/gfx-webgl2.ts`（C2）用 gfx 便捷层 + `Renderer.create({ backend: 'webgl2' })`。
2. **三种真实打包器**（都用仓库里 vite 已锁定的版本）：
   - `rollup@4.63.2`（配 esbuild 只做 TypeScript 去类型，不参与摇树）
   - `esbuild@0.21.5`
   - `vite@5.4.21`（内部同样走 rollup + esbuild minify）
3. **符号判定**：在产物里搜**只可能由 WebGPU 后端产生**的完整标识符
   （`WebGPUAdapter`、`WebGPUDevice`、`WebGPURenderPassEncoder`、`preferredCanvasFormat`、
   `requestWebGPUAdapter`、`wgpuFormatMap`、`WGPU_DEVICE_LOST`、`createWebGPUAdapter`），
   同时搜 WebGL2 对照符号（`WebGL2Adapter`、`WebGL2Device`、`glStateCache`、`glEnumMap`）
   以证明「搜索本身有效」——否则满屏 `-` 是假阴性。
4. **反事实探针 C4**：`consumers/webgl2-subentry.ts` + `subentry/webgl2.ts`
   （一个**假想的** `@dxyl/gpu-device-api/webgl2` 子入口，只重导出 core/utils/webgl2）。
   它不是当前包的用法，只用来给「切子入口能省多少」定上界。

## 三种被测目标（`--mode`）

| mode | 被测目标 | 说明 |
| --- | --- | --- |
| `src` | `src/index.ts` | 工作区源码，与 `pnpm run build` 的输入一致 |
| `modules` | `.tmp-14/libmodules/index.js` | `preserveModules` 产物（每模块一个文件），供 rollup 用 |
| `dist` | `.tmp-14/libdist/gpu-device-api.js` | 单文件 ESM 产物，与发布形态一致 |

`modules` 这一份是必要的：消费方真实拿到的是**单文件** `dist/gpu-device-api.js`，
而 rollup 对单文件只能做语句级 DCE。为了不因为「单文件」这一个形态因素误判，
额外用 `vite.lib.modules.config.ts` 产出一份 preserveModules 版本，让三种打包器面对同构的模块图。

## 复现步骤

```powershell
# 1) 把工作区源码打成两种形态（输出全在 .tmp-14/，不碰 dist/）
pnpm exec vite build --config .tmp-14/vite.lib.tmp.config.ts       # -> .tmp-14/libdist/
pnpm exec vite build --config .tmp-14/vite.lib.modules.config.ts   # -> .tmp-14/libmodules/

# 2) 跑测量（三种打包器 × 四个消费方 × raw/min）
node .tmp-14/measure.mjs --mode src     --out .tmp-14/measure-src.json
node .tmp-14/measure.mjs --mode modules --out .tmp-14/measure-modules.json
node .tmp-14/measure.mjs --mode dist    --out .tmp-14/measure-dist.json

# 3) 量一下库本身的产物（同口径：raw + gzip-9）
node .tmp-14/size-report.mjs
```

## 第一步结论（数字见 `RESULT.md`）

**树摇完全没有摇掉 WebGPU 后端**：C1（只用 WebGL2）与 C3（两个后端都要）
在三种打包器下的产物体积**逐字节相同**（差值 −2 字节，来自被压缩掉的字符串字面量），
且 C1 产物里 WebGPU 的完整符号全部在位。

根因在源码结构，不在打包器：`src/factories/default-registry.ts` **静态 import** 了
`WebGL2Adapter` 与 `WebGPUAdapter`，而 `createDevice` 无条件引用 `createDefaultBackendRegistry()`。
`backend: 'webgl2'` 是运行时字符串，打包器无法据此裁掉 `WebGPUFactory`。

反事实探针 C4 证明**切子入口确实有真实收益**，所以进入第二步。
完整数字见 [`RESULT.md`](./RESULT.md)。
