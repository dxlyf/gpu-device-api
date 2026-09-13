import { defineConfig } from 'vite';

/**
 * 库构建：产出 `dist/gpu-device-api.js`（ESM）以及类型声明
 * （声明由 `tsc -p tsconfig.build.json` 生成）。
 */
export default defineConfig({
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: 'src/index.ts',
      name: 'GPUDeviceAPI',
      formats: ['es'],
      fileName: () => 'gpu-device-api.js',
    },
    rollupOptions: {
      external: [],
    },
  },
});
