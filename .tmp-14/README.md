# 批 14：打包入口拆分 —— 第一步测量（可复现证据）

> 本目录是批 14 独占的临时目录（`.tmp-14/`，被 `.gitignore` 的 `.tmp-*/` 忽略；
> 本目录里的**测量脚本与消费方探针入库**，构建产物、日志与 JSON 不入库）。
>
> ⚠️ **仓库的 `dist/` 只被写过一次**：那是为了验证路 A 的 `pnpm run build` 本身能跑通
> （路 A 的产物目录就是 `dist/`）。跑完已用 `git clean -fd dist` 清掉全部未跟踪残渣，
> 现在 `git status --porcelain -- dist` 为空、`dist/gpu-device-api.js` 与 HEAD 逐字节相同。
> **其余一切测量都重定向到 `.tmp-14/`。**

## 要回答的问题

一个**只用 WebGL2** 的使用方，是否已经被迫把整个 WebGPU 后端打进自己的 bundle？

## 方法（可判定，不靠体积猜）

1. **对照组**：`consumers/core-webgl2.ts`（C1）与 `consumers/all-backends.ts`（C3）
   **逐行相同**，只差 `createDevice({ backend: 'webgl2' })` / `{ backend: 'auto' }` **一处字符串**。
   另外 `consumers/gfx-webgl2.ts`（C2）用 gfx 便捷层 + `Renderer.create({ backend: 'webgl2' })`。
2. **三种真实打包器**（都用仓库里 vite 已锁定的版本）：
   - `rollup@4.63.2`（配 esbuild 只做 TypeScript 去类型，不参与摇树）
   - `esbuild@0.21.5`
   - `vite@5.4.21`（内部走 rollup + esbuild minify）
3. **符号判定**：在产物里搜**只可能由 WebGPU 后端产生**的完整标识符
   （`WebGPUAdapter`、`WebGPUDevice`、`WebGPURenderPassEncoder`、`preferredCanvasFormat`、
   `requestWebGPUAdapter`、`FALLBACK_DEVICE_LIMITS` 等），同时搜 WebGL2 对照符号
   （`WebGL2Adapter`、`WebGL2Device`、`GlStateCache`、`glEnumMap`）
   以证明「搜索本身有效」—— 否则满屏 `-` 是假阴性。
4. **子入口探针**：`consumers/webgl2-subentry.ts`（C4，只 import WebGL2 后端 + 一个枚举）、
   `consumers/webgl2-subentry-lit.ts`（C5，与 C1 语义等价但走 `/webgl2` 入口）、
   `consumers/core-only.ts`（C6，只 import 两个枚举）。用来量「子入口能省多少」。

## 三种被测目标（`--mode`）

| mode | 被测目标 | 说明 |
| --- | --- | --- |
| `src` | `src/index.ts` | 工作区源码，与 `tsc -p tsconfig.build.json` 的输入一致 |
| `dist` | `dist/index.js` | **真实发布产物**（路 A 的 tsc 模块树，每源文件一个 `.js`） |
| `modules` | `.tmp-14/libmodules/index.js` | 早期「路 B」对照用的 preserveModules 产物（历史保留） |

`dist` 那一份是最该看的：它就是 npm 上发布的形态。

## 复现步骤

```powershell
# 1) 路 A 的产物（tsc 模块树）。注意：这会写仓库 dist/，是这个仓库构建的**正常行为**。
#    本批只在「验证构建能跑通」时跑过，之后已 git clean -fd dist 清理干净。
node scripts/build.mjs

# 2) 跑测量（三种打包器 × 六个消费方 × raw/min）
node .tmp-14/measure.mjs --mode src  --key pathA-src  --out .tmp-14/measure-pathA-src.json
node .tmp-14/measure.mjs --mode dist --key pathA-dist --out .tmp-14/measure-pathA-dist.json

# 3) 校验 tsc 产物是「可消费 ESM」：552 条相对说明符逐条落地 + 四个入口可 import
node .tmp-14/verify-emit.mjs dist

# 4) 主入口 A/B：同一份源码 + 新旧构建方式，产物逐字节比对
node .tmp-14/ab-main-entry.mjs

# 5) 发布形态冒烟（真实 dist + package.json exports 的一致性）
node .tmp-14/verify-dist.mjs
```

> 冻结快照（`.tmp-14/snapshot/`，不入库）用于「改前 / 改后」面对同一份源码做对比，
> 做法见 `snapshot/README.md` 与 `RESULT.md` 的「第二步」。

## 第一步结论

**树摇完全没有摇掉 WebGPU 后端**：C1（只用 WebGL2）与 C3（两个后端都要）
在三种打包器下的产物体积**逐字节相同**（差值 −2 字节，来自被压缩掉的字符串字面量），
且 C1 产物里 WebGPU 的完整符号全部在位。

根因在源码结构，不在打包器：`src/factories/default-registry.ts` **静态 import** 了
`WebGL2Adapter` 与 `WebGPUAdapter`，而 `createDevice` 无条件引用 `createDefaultBackendRegistry()`。
`backend: 'webgl2'` 是运行时字符串，打包器无法据此裁掉 `WebGPUFactory`。

完整数字见 [`RESULT.md`](./RESULT.md)。
