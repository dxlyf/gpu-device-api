import { defineConfig } from 'vite';

/**
 * 这个文件**只服务 dev server 与示例页**（`pnpm run dev` / 打开 `examples/*.html`）。
 *
 * 库构建（批 14 起）**不经过 vite**：`pnpm run build` 直接跑
 * `tsc -p tsconfig.build.json` 输出模块树到 `dist/`，理由与实测见 `scripts/build.mjs`
 * 顶部注释与 `.tmp-14/RESULT.md`。所以这里**刻意不再有 `build.lib`**：
 *
 * - 打包器产物（单文件 ESM + `"sideEffects": false`）实测无法为「只用 WebGL2」的使用方
 *   摇掉 WebGPU 后端 —— 三种打包器下产物体积与「两个后端都要」逐字节相同；
 * - 模块树让消费方的打包器按模块粒度静态分析，这个问题才真正消失。
 *
 * 保留 `build` 里的通用字段（target / outDir 不设，交给命令行的子配置）是为了让
 * `pnpm run build:demo`（`vite.demo.config.ts`）继续按原样工作。
 */
export default defineConfig({
  // 编辑器与工具在写入文件时会创建临时目录（形如 `.main.ts.1234.hash.tmpdir`）。
  // 文件监听器若去 watch 它们，在 Windows 上会抛 EBUSY 并把 dev server 直接搞崩 ——
  // 这个坑已经踩过一次，所以显式忽略掉这些不属于源码的路径。
  server: {
    watch: {
      // 用函数而不是 glob：临时目录名里带随机哈希，且可能出现在仓库根目录下（路径前缀为空），
      // glob 的 `**/` 前缀在这种情形下不保证匹配。函数式判断最稳。
      //
      // 除了编辑器生成的 `.tmpdir`，还要忽略本仓库自己约定的调试目录 `.tmp-*`
      // （脚本与代理会在里面写截图、日志与对照数据）。这些文件在**被写入的同时**会被
      // 监听器看到，Windows 上同样抛 EBUSY 直接搞崩 dev server —— 已经因此崩过一次。
      ignored: (path: string) => path.includes('.tmpdir') || path.includes('.tmp-'),
    },
  },
  build: {
    target: 'es2022',
    emptyOutDir: false,
  },
});
