/// <reference types="vite/client" />

/**
 * 让 `test/**` 里的用例能用 vite 的导入后缀（`?raw` / `?url`）与 `import.meta.glob`。
 *
 * 批 14 的 `test/entry-surface-dist.test.ts` 需要读 `dist/` 里的产物文本（校验模块树的
 * 相对说明符），但又**不能用 `node:fs`** —— 本仓库没有装 `@types/node`，用了会让
 * `tsc --noEmit` 直接报 TS2307。vite 的 `?raw` / `?url` / `import.meta.glob` 正好覆盖这个需求，
 * 而且走的是 vitest 自己的转换管线（无需 Node 类型）。
 *
 * 除了这份 reference，仓库其余部分（`src/`）仍然不依赖 vite 的类型。
 */
