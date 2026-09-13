import { defineConfig } from 'vite';

/**
 * 库构建：产出 `dist/gpu-device-api.js`（ESM）以及类型声明
 * （声明由 `tsc -p tsconfig.build.json` 生成）。
 */
export default defineConfig({
  // 编辑器与工具在写入文件时会创建临时目录（形如 `.main.ts.1234.hash.tmpdir`）。
  // 文件监听器若去 watch 它们，在 Windows 上会抛 EBUSY 并把 dev server 直接搞崩 ——
  // 这个坑已经踩过一次，所以显式忽略掉这些不属于源码的路径。
  server: {
    watch: {
      // 用函数而不是 glob：临时目录名里带随机哈希，且可能出现在仓库根目录下（路径前缀为空），
      // glob 的 `**/` 前缀在这种情形下不保证匹配。函数式判断最稳。
      ignored: (path: string) => path.includes('.tmpdir'),
    },
  },
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
