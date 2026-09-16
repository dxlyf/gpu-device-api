# 批 14 两步测量结果（原始数字）

环境：`node v24.20.0`、`pnpm 12.3.4`、`rollup 4.63.2`、`esbuild 0.21.5`、`vite 5.4.21`。
口径：`raw` = 产物 UTF-8 字节数；`gzip` = Node `zlib.gzipSync(level: 9)`。
`min` = 打包器开启压缩；`raw` = 不压缩（不压缩的产物里能直接 grep 到符号名，判定更可靠）。

## 库产物本身

| 产物 | raw | gzip-9 |
| --- | --- | --- |
| `dist/gpu-device-api.js`（已提交，落后于 src） | 699 359 | 211 649 |
| `.tmp-14/libdist/gpu-device-api.js`（本批从**工作区 src** 构建，单文件） | 865 852 | 233 169 |
| `.tmp-14/libmodules/`（preserveModules，148 个模块） | 907 257 | — |

> 注意：`.tmp-14/libdist` 比已提交的 `dist` 大，是因为**工作区里有另外两个代理未提交的 src 改动**
> （WebGPU `colorFormats` 空位语义、WebGL2 探针页）。这批数字只用于**同一批构建内部的相对比较**，
> 不用于声称「发布产物变大了」。

## 第一步：树摇到底有没有生效

`mode=src`（工作表源码），minified：

| 打包器 | C1 只用 WebGL2 | C3 两个后端都要 | C3 − C1 | C1 里有没有 WebGPU 符号 |
| --- | --- | --- | --- | --- |
| esbuild | 291 738 | 291 736 | **−2** | 有：`WebGPUAdapter` `WebGPUDevice` |
| vite | 479 421 | 479 419 | **−2** | 有：`WebGPUAdapter` `WebGPUDevice` `WebGPURenderPassEncoder` |

（rollup 不能直接吃 TypeScript，`mode=src` 下只跑 esbuild / vite 两条；rollup 的数字见下表 `mode=modules`。）

gzip 同样逐字节相同（esbuild 81 464 / 81 464，vite 147 804 / 147 805）。
C1 与 C3 的代码**只差一个字符串字面量**，那 −2 字节正来自它。

`mode=modules`（preserveModules，排除「单文件产物不好摇」这个干扰因素）与 `mode=src` 结论一致
（rollup 走这一份；另两个打包器在两种形态下数字几乎相同，差异来自产物形态而非摇树）：

| 打包器 | C1 | C3 | C3 − C1 |
| --- | --- | --- | --- |
| rollup | 585 003 | 585 001 | −2 |
| esbuild | 291 465 | 291 463 | −2 |
| vite | 479 421 | 479 419 | −2 |

C2（gfx 便捷层 + `backend: 'webgl2'`）同样是「两个后端全在」的体积：
rollup 733 486、esbuild 370 757、vite 601 956（min），WebGPU 符号全部在位。

**结论：树摇完全没有摇掉 WebGPU 后端。** 三种打包器、两种产物形态、四个消费方，六个组合一致。

根因（源码结构，与打包器无关）：`src/factories/default-registry.ts` 静态 import 了
`WebGL2Adapter` 与 `WebGPUAdapter`，`createDevice` 无条件调用 `createDefaultBackendRegistry()`。
`backend: 'webgl2'` 是运行时字符串，打包器无法据此裁掉 `WebGPUFactory` 及其整棵子树。

## 反事实：假如有 `/webgl2` 子入口（C4）

`consumers/webgl2-subentry.ts` 用假想的 `@dxyl/gpu-device-api/webgl2`（只重导出 core/utils/webgl2），
其它代码与 C1 逐行对应：

| 打包器 | C4 min raw | C4 min gzip | 相对 C3 省 raw | 相对 C3 省 gzip | C4 里的 WebGPU 符号 |
| --- | --- | --- | --- | --- | --- |
| rollup（mode=modules） | 167 843 | 49 543 | 417 160 | 112 142 | 无 |
| esbuild（mode=src） | 167 843 | 49 543 | 123 893 | 31 921 | 无 |
| vite（mode=src） | 269 541 | 86 778 | 209 878 | 61 027 | 无 |

> rollup 与 esbuild 的 C4 恰好逐字节相同，是因为两者都吃同一份源码、同一份 tree-shake 设定，
> 且 C4 这条路径下 rollup 没有额外注入任何运行时辅助代码（无跨 chunk、无 helper）。

**切子入口有真实收益**：只用 WebGL2 的消费方 gzip 从 81 KB 降到 50 KB（esbuild 口径，−39%）。
所以进入第二步。

## 开工时的验收基线（本批开始前，工作区已有别人的未提交改动）

- `pnpm exec tsc --noEmit`：**红**，6 条错误，全部在 `src/webgpu/pipeline/WebGPURenderPipeline.ts`
  与 `src/webgpu/pipeline/WebGPURenderState.ts`（`TextureFormat | null` 未收窄）。
  `git status` 显示 `src/core/pipeline/RenderPipeline.ts`、`src/core/pipeline/RenderState.ts`、
  `src/webgpu/pipeline/WebGPURenderState.ts`、`src/webgpu/render/WebGPURenderPassEncoder.ts`
  处于 `M`（另外两个代理的在飞改动）。**不是本批引入**。
- `pnpm exec vitest run --no-file-parallelism`：**45 文件 / 730 用例**，
  `test/webgpu-mrt-positional-formats.test.ts` 与 `test/webgpu-mrt-null-slots.test.ts` 共 8–14 条失败
  （同一批在飞改动；两次跑的失败数不同，说明那批改动尚未稳定）。其余全过。
- 本批新增的 `.tmp-14/consumers/*.ts` 探针自身类型检查通过（同一命令下报出的错误全部来自上面那两个 src 文件）。

