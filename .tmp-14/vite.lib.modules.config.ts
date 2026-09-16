/**
 * 批 14 测量专用（第二种库产物形态）：`preserveModules` 输出，**每个 src 模块一个 .js 文件**。
 *
 * 为什么要它：消费方真实拿到的是 `dist/gpu-device-api.js`（单文件）。但「树摇能摇掉多少」
 * 这件事在**单文件**产物上取决于 rollup 的语句级 DCE，而真实 npm 包也可能是多文件。
 * 为了让 rollup 这条测量与 esbuild / vite 可比（三者都对同构的模块图做摇树），
 * 这里额外产出一份 preserveModules 版本给 rollup 用。
 *
 * 输出到 `.tmp-14/libmodules/`，绝不写仓库 `dist/`。
 */

import { defineConfig } from 'vite';
import base from '../vite.config.js';

export default defineConfig({
  ...base,
  build: {
    ...base.build,
    outDir: '.tmp-14/libmodules',
    emptyOutDir: true,
    sourcemap: false,
    minify: false,
    rollupOptions: {
      ...base.build?.rollupOptions,
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
      },
    },
  },
});
