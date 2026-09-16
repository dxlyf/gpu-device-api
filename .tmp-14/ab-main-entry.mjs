/**
 * 批 14 A/B 验证：证明主入口产物**逐字节不变**。
 *
 * 对比（同一份源码 —— 冻结快照 `.tmp-14/snapshot/src`）：
 *   A. 「批 14 之前」的构建形状：`vite build` + 单入口 `lib.entry` + `fileName: () => 'gpu-device-api.js'`
 *   B. 「批 14 之后」的构建形状：与 `scripts/build.mjs` 完全相同 —— 用 vite 的 JS API
 *      `loadConfigFromFile()` 读 `vite.config.ts`，再程序化覆盖 `build.lib.entry` / `fileName`
 *
 * 单一变量是**构建方式**（配置读取 + 程序化覆盖），源码与 rollup 参数完全相同。
 * 产出 `ab-before.js` / `ab-after.js` 后直接比 SHA256 与字节数。
 *
 * 产物全在 `.tmp-14/abtest/`，不碰仓库 `dist/`。
 * 用法： node .tmp-14/ab-main-entry.mjs
 */

import { readFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');
const require = createRequire(join(repoRoot, 'package.json'));
const viteRequire = createRequire(require.resolve('vite/package.json'));
// 用 vite 的 ESM 入口（`createRequire('vite')` 会走 CJS 入口并打印 deprecation 警告）
const { build, loadConfigFromFile } = await import(
  new URL('file:///' + join(dirname(viteRequire.resolve('vite/package.json')), 'dist', 'node', 'index.js').replace(/\\/g, '/')).href
);

const outDir = join(here, 'abtest');
const snapshotEntry = join(here, 'snapshot', 'src', 'index.ts');

/** 共用的构建参数（两个构建逐字相同，只有 lib 覆盖方式不同）。 */
function commonBuild(entry, fileName) {
  return {
    root: here,
    configFile: false,
    logLevel: 'silent',
    build: {
      target: 'es2022',
      outDir,
      emptyOutDir: false,
      sourcemap: false, // 关掉 sourcemap：比的是 JS 产物本身，map 里含绝对路径会引入噪声
      minify: false, // 关掉压缩：能直接在产物里 grep 符号
      write: true,
      lib: { entry, name: 'GPUDeviceAPI', formats: ['es'], fileName: () => fileName },
      rollupOptions: { external: [] },
    },
  };
}

await rm(join(outDir, 'ab-before.js'), { force: true });
await rm(join(outDir, 'ab-after.js'), { force: true });

// A：「批 14 之前」的形状 —— 一份只有单入口的配置，直接 vite build
await build(commonBuild(snapshotEntry, 'ab-before.js'));

// B：「批 14 之后」的形状 —— 与 scripts/build.mjs 相同的程序化路径
const loaded = await loadConfigFromFile({ command: 'build', mode: 'production' }, join(repoRoot, 'vite.config.ts'), repoRoot);
await build({
  ...(loaded?.config ?? {}),
  root: here,
  configFile: false,
  logLevel: 'silent',
  build: {
    ...(loaded?.config?.build ?? {}),
    target: 'es2022',
    outDir,
    emptyOutDir: false,
    sourcemap: false,
    minify: false,
    write: true,
    lib: { entry: snapshotEntry, name: 'GPUDeviceAPI', formats: ['es'], fileName: () => 'ab-after.js' },
  },
});

for (const name of ['ab-before.js', 'ab-after.js']) {
  const buffer = await readFile(join(outDir, name));
  const hash = createHash('sha256').update(buffer).digest('hex');
  console.log(`${name}: ${buffer.length} bytes  sha256=${hash}`);
}

const before = await readFile(join(outDir, 'ab-before.js'));
const after = await readFile(join(outDir, 'ab-after.js'));
console.log(before.equals(after) ? '\n✔ 逐字节相同（主入口产物未变）' : '\n✘ 产物不同 —— 构建改动影响了主入口');
process.exit(before.equals(after) ? 0 : 1);
