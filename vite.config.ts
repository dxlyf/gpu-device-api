import { defineConfig } from 'vite';

/**
 * Library build: emits `dist/gpu-device-api.js` (ESM) + type declarations
 * (declarations are produced by `tsc -p tsconfig.build.json`).
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
