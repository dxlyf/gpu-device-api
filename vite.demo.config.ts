import { defineConfig } from 'vite';

/** Demo/示例构建。`pnpm dev` 启动的也是同一个入口。 */
export default defineConfig({
  build: {
    target: 'es2022',
    outDir: 'dist-demo',
    emptyOutDir: true,
    sourcemap: true,
  },
});
