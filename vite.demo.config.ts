import { defineConfig } from 'vite';

/** Demo/example build. `pnpm dev` serves the same entry point. */
export default defineConfig({
  build: {
    target: 'es2022',
    outDir: 'dist-demo',
    emptyOutDir: true,
    sourcemap: true,
  },
});
