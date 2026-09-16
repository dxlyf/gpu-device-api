/**
 * 批 14 验证用：把**冻结快照**用**新配置的形状**（单次 vite build，单入口写法与
 * `vite.config.ts` 中 `GPU_DEVICE_API_ENTRY=src/index.ts` 时完全一致）构建，
 * 输出到 `.tmp-14/abtest/new.js`。
 *
 * 与 `vite.abtest.old.config.ts` 的唯一差别：`minify: false`（两边一致）之外，
 * 这里刻意复刻新配置里的 `lib.entry` / `fileName` 写法与 `rollupOptions`。
 * 两者产物若逐字节相同，就说明批 14 的构建配置改动**没有改变主入口产物**。
 */

import { defineConfig } from 'vite';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// 见 `vite.abtest.old.config.ts`：`lib.entry` 相对配置文件目录解析，这里显式用绝对路径。
const here = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  configFile: false,
  build: {
    target: 'es2022',
    outDir: join(here, 'abtest'),
    emptyOutDir: false,
    sourcemap: false,
    minify: false,
    write: true,
    lib: {
      // 与新的 `vite.config.ts` 同形：entry 来自环境变量，fileName 是一个函数
      entry: process.env.GPU_DEVICE_API_ENTRY ?? join(here, 'snapshot', 'src', 'index.ts'),
      name: 'GPUDeviceAPI',
      formats: ['es'],
      fileName: () => process.env.GPU_DEVICE_API_FILE_NAME ?? 'new.js',
    },
    rollupOptions: {
      external: [],
    },
  },
});
