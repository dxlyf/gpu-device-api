/**
 * 批 14 专用：把**工作区源码**打成 `dist` 等价产物，但输出到 `.tmp-14/libdist/`，
 * **绝不写仓库的 `dist/`**（工作区里可能有其它代理未提交的 src 改动，`dist` 由负责人统一重建）。
 *
 * 复用仓库 `vite.config.ts`（含那段函数式 `server.watch.ignored`）后只覆盖输出目录。
 */

import { defineConfig } from 'vite';
import base from '../vite.config.js';

export default defineConfig({
  ...base,
  build: {
    ...base.build,
    outDir: '.tmp-14/libdist',
    emptyOutDir: true,
    sourcemap: false,
    // 最小化关闭：测量要的是「树摇是否生效」，不是压缩率
    minify: false,
  },
});
