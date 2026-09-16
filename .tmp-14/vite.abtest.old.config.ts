/**
 * 批 14 验证用：把**冻结快照**（`.tmp-14/snapshot/src`，与提交 e51acf1 时的 `src/` 逐字节相同）
 * 用**批 14 之前那份 vite.config.ts** 的等价配置（单入口 `src/index.ts`）重新构建，
 * 输出到 `.tmp-14/abtest/old.js`。
 *
 * 目的：证明「主入口 `dist/gpu-device-api.js` 的内容与行为不变」这句话，
 * 用的是**同一份源码 + 旧配置** vs **同一份源码 + 新配置** 的逐字节比对，
 * 而不是拿工作区（含别人未提交改动）去和历史 `dist` 比。
 */

import { defineConfig } from 'vite';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// 注意：`lib.entry` 是相对**配置文件所在目录**解析的（inline config 不带 root 时），
// 所以这里显式拼绝对路径，避免相对路径带来的歧义。
const here = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  configFile: false,
  build: {
    target: 'es2022',
    outDir: join(here, 'abtest'),
    emptyOutDir: true,
    sourcemap: false,
    minify: false,
    write: true,
    lib: {
      entry: join(here, 'snapshot', 'src', 'index.ts'),
      name: 'GPUDeviceAPI',
      formats: ['es'],
      fileName: () => 'old.js',
    },
    rollupOptions: {
      external: [],
    },
  },
});
