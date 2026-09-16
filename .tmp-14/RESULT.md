# 批 14 两步测量结果（原始数字）

环境：`node v24.20.0`、`pnpm 12.3.4`、`rollup 4.63.2`、`esbuild 0.21.5`、`vite 5.4.21`。
口径：`raw` = 产物 UTF-8 字节数；`gzip` = Node `zlib.gzipSync(level: 9)`。
`min` = 打包器开启压缩；`raw` = 不压缩（不压缩的产物里能直接 grep 到符号名，判定更可靠）。

---

## 第一步：树摇到底有没有生效（结论：**没有**）

`mode=src`（工作表源码），minified：

| 打包器 | C1 只用 WebGL2 | C3 两个后端都要 | C3 − C1 | C1 里有没有 WebGPU 符号 |
| --- | --- | --- | --- | --- |
| rollup | 585 003 | 585 001 | **−2** | 有：`WebGPUAdapter` `WebGPUDevice` `WebGPURenderPassEncoder` `WebGPUBindGroup` |
| esbuild | 291 738 | 291 736 | **−2** | 有：`WebGPUAdapter` `WebGPUDevice` `WebGPUBindGroup` |
| vite | 479 421 | 479 419 | **−2** | 有：`WebGPUAdapter` `WebGPUDevice` `WebGPURenderPassEncoder` |

gzip 同样逐字节相同（esbuild 81 464 / 81 464，vite 147 804 / 147 805）。
C1 与 C3 的代码**只差一个字符串字面量**，那 −2 字节正来自它。

补充：`mode=modules`（preserveModules）与早期的单文件 ESM 形态下结论一致 ——
三个打包器、两种产物形态、六个消费方，**每个组合都是 −2 字节**。

C2（gfx 便捷层 + `backend: 'webgl2'`）同样背上整个 WebGPU 后端。

**根因（源码结构，与打包器无关）**：`src/factories/default-registry.ts` 静态 import 了
`WebGL2Adapter` 与 `WebGPUAdapter`，`createDevice` 无条件调用 `createDefaultBackendRegistry()`。
`backend: 'webgl2'` 是运行时字符串，打包器无法据此裁掉 `WebGPUFactory` 及其整棵子树。

---

## 第二步（路 A：`tsc` 输出模块树）

### 2.1 硬前提校验（`node .tmp-14/verify-emit.mjs dist`）

| 项 | 数字 |
| --- | --- |
| 产物 `.js` 文件数 | 178 |
| 相对说明符总数 | 552 |
| 说明符缺失（目标文件不存在） | **0** |
| 非 `.js` 结尾的说明符 | **0** |
| 四个入口可被 Node 真实 import | 是（index 251 / core 151 / webgl2 218 / webgpu 297 个导出名） |

### 2.2 消费方 bundle 体积（`mode=dist`，即真实 tsc 模块树）

minified。C5 与 C1 是**语义等价、逐行对应**的消费方，只把 import 来源从主入口换成 `/webgl2`：

| 打包器 | C1 主入口（webgl2） | C5 `/webgl2` 子入口 | 省 raw | 省 gzip | C5 里有没有 WebGPU |
| --- | --- | --- | --- | --- | --- |
| rollup | 845 258 | **496 681** | 348 577 (−41.2%) | 94 532 | **没有** |
| esbuild | 291 738 | **167 843** | 123 895 (−42.5%) | 31 902 (−39.2%) | **没有** |
| vite | 470 039 | **263 683** | 206 356 (−43.9%) | 60 479 (−40.9%) | **没有** |

对照 C3（`backend: 'auto'`，两个后端都要）：rollup 845 256 / esbuild 291 736 / vite 470 037
—— 即 **C1 与 C3 仍然逐字节相同（−2）**，说明「主入口 + 运行时选后端」这条路省不了；
省下来的完全来自**子入口**。

只用枚举（C6，`/core` 入口 + 两个枚举）：**esbuild 411 B / gzip 286**、vite 346 B / gzip 239。

### 2.3 主入口内容未变（`node .tmp-14/ab-main-entry.mjs`）

同一份冻结快照源码（`.tmp-14/snapshot/src`），分别用「批 14 之前的构建形状」与
「批 14 之后的构建形状」构建主入口，产物**逐字节相同**：

```
ab-before.js: 865867 bytes  sha256=746d9e925ae529e6c3a0d2c4634ba409cf5814274582ca0d60c1875f06359491
ab-after.js:  865867 bytes  sha256=746d9e925ae529e6c3a0d2c4634ba409cf5814274582ca0d60c1875f06359491
✔ 逐字节相同
```

> 这个比对用的是**冻结快照**而不是工作区：工作区里有另外几个代理在飞改 `src`，
> 直接比对会把他们的改动算成本批的效果。快照与提交 `e51acf1` 时的 `src/` 逐字节相同。

### 2.4 `dist/` 形态前后对比

| | 批 14 之前 | 路 A（现在） |
| --- | --- | --- |
| 顶层入口 | `gpu-device-api.js`（单文件，699 359 B / gzip 211 649） | `index.js` + `core.js` + `webgl2.js` + `webgpu.js`（每个 1.1~1.7 KB，只是 re-export） |
| 其余产物 | 无（全在单文件里） | 每源文件一个 `.js` + `.d.ts` + 两类 `.map` |
| 文件数 | 352（1 个 bundle + 1 map + 350 个 `types/**`） | 712（178 `.js` + 178 `.d.ts` + 356 `.map`） |
| 总字节 | ~2.77 MB | ~3.18 MB |
| 类型声明位置 | `dist/types/**` | `dist/**`（与 `.js` 同级） |
| 消费方要不要打包器 | 不要（`<script type="module">` 直接引单文件即可） | **要**（模块树；合成 1 个还是 N 个 chunk 由消费方决定） |

---

## 开工时的验收基线（本批开始前，工作区已有别人的未提交改动）

- `pnpm exec tsc --noEmit`：**红**，6 条错误，全部在 `src/webgpu/pipeline/WebGPURenderPipeline.ts`
  与 `src/webgpu/pipeline/WebGPURenderState.ts`（`TextureFormat | null` 未收窄）。
  那几个文件当时处于 `M`（另外两个代理的在飞改动）。**不是本批引入**；收工时已自行变绿。
- `pnpm exec vitest run --no-file-parallelism`：**45 文件 / 730 用例**，
  `test/webgpu-mrt-positional-formats.test.ts` 与 `test/webgpu-mrt-null-slots.test.ts` 有失败
  （同一批在飞改动）。
- 本批新增的 `.tmp-14/consumers/*.ts` 探针自身类型检查通过。
