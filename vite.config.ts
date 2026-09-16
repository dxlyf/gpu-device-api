import { defineConfig } from 'vite';

/**
 * 发布形态（批 15 定稿）：**两条路并存，各有明确职责**。
 *
 * 1. **模块树 + 类型声明 → `tsc`**（`tsc -p tsconfig.build.json`，批 14 起）。
 *    每个源文件一个 `.js` + 同级 `.d.ts` + `.map`，对外入口平铺在 `dist/` 根下
 *    （`index.js` / `core.js` / `webgl2.js` / `webgpu.js`）。消费方的打包器按**模块粒度**
 *    静态分析，于是「只用 WebGL2」的使用方天然不会带上 WebGPU 后端
 *    —— 实测 gzip −39~41%，见 `.tmp-14/RESULT.md`。
 * 2. **UMD / ES 单文件包 → `vite build`**（就是下面这份配置）。给**没有打包器**的场景：
 *    CDN 直引、`<script src>`、`require()`。
 *
 * ⚠️ **单文件包打的必然是主入口 `src/index.ts`，所以两个后端都在里面。**
 * 实测（`.tmp-14/RESULT.md` 第一步）：主入口 + 运行时字符串选后端，三种打包器都摇不掉
 * 另一个后端（C1 与 C3 产物体积差值就是那处 `'webgl2'` 字符串的 −2 字节）。
 * 所以：**想要更小 → 用子入口 + 打包器；想要单文件 → 接受两个后端都在。**
 *
 * ⚠️ **构建顺序是 `vite` 在前、`tsc` 在后**（见 `package.json` 的 `scripts.build`）。
 * `vite build` 会按 `emptyOutDir` **清空 `dist/`**；若反过来先 `tsc` 再 `vite`，
 * `tsc` 刚生成的整个模块树会被 vite 删掉（这是本批最容易踩的坑）。vite 在前时：
 * 第 1 步清空并写下两个单文件包，第 2 步 `tsc` 只写自己的文件、**不删目录**，
 * 两者文件名不重叠，于是互不覆盖。`emptyOutDir: true` 因此是**必须**的
 * （它同时负责把上一次构建的陈旧产物，例如批 14 之前的 `dist/types/**` 清干净）。
 *
 * ⚠️ **UMD 必须落在 `.cjs`**：`package.json` 是 `"type": "module"`，`.js` 会被 Node 当成
 * ESM 解析 —— `require()` 拿到的不是这份 UMD 的导出（Node 24 会按 ESM 加载，
 * 于是命名导出全丢）。实测证据见 `.tmp-15/RESULT.md`。
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
    outDir: 'dist',
    // 见文件头第 3 段：vite 是 `pnpm run build` 的第一步，清空动作由它负责。
    emptyOutDir: true,
    // 与模块树（`tsconfig.build.json` 的 `sourceMap` / `declarationMap`）保持一致：
    // 单文件包里 UMD 是完全压缩的，没有 map 就只能看到 `at ni (...:1:20345)`。
    // 体积代价已实测：两份 map 合计 4,094,526 B（gzip 1,155,304 B），约占 `dist` 总字节的 49%
    // —— 见 `.tmp-15/RESULT.md`；若要省这份体积，把这一行改成 `false` 即可
    // （npm tarball 会从 2,410,524 B 降到 ≈1.26 MB）。
    sourcemap: true,
    lib: {
      entry: 'src/index.ts',
      // UMD 的全局名（沿用批 14 之前的名字，仓库里没有别处引用它）。
      name: 'GPUDeviceAPI',
      formats: ['umd', 'es'],
      // `es` 会被 Vite 的 lib 模式刻意「保留空白」（`minifyWhitespace: false`，只压标识符与语法，
      // 因为它假定下游打包器还会再压一次）—— 这不是配置没生效，是本批实测确认的行为。
      // UMD 则完整压缩。两者的实际字节数见 `.tmp-15/RESULT.md`。
      fileName: (format: string) => (format === 'umd' ? 'gpu-device-api.umd.cjs' : 'gpu-device-api.es.js'),
    },
    // 单文件包必须**自包含**：显式声明不外部化任何依赖。
    // （本库没有运行时依赖，`@webgpu/types` 只在类型层面出现，所以这里不是「靠它兜住」
    //   而是一道防线：将来误加运行时依赖时，产物里会露出裸 import 而不是悄悄少一块。）
    rollupOptions: {
      external: [],
    },
  },
});
