/**
 * 为 rollup 那条测量生成「子入口探针」。
 *
 * 背景：vite 5 的库构建把 barrel 文件（`core/index.ts` 这种纯 re-export 文件）**合进了入口 chunk**，
 * 所以 `preserveModules` 产物里没有 `core/index.js`、`webgl2/index.js`。要按子树导入，
 * 只能自己拼一个只 re-export 叶子模块的 barrel。
 *
 * 本脚本扫描 `.tmp-14/libmodules/<子树>/` 下所有 `.js`（跳过 `index.js`），
 * 逐个生成 `export * from './...';`，写进 `.tmp-14/subentry-modules/gen-<子树>.js`。
 * 只在 `--mode modules` 的测量里用；仓库与发布产物完全不受影响。
 *
 * 用法： node .tmp-14/gen-subentries.mjs
 */

import { readdir, writeFile } from 'node:fs/promises';
import { dirname, join, posix, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const libmodules = join(here, 'libmodules');

/** 递归收集所有 .js（相对 libmodules 的 posix 路径），跳过 barrel（index.js）。 */
async function collect(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...(await collect(full)));
    } else if (entry.name.endsWith('.js') && entry.name !== 'index.js') {
      found.push(relative(libmodules, full).split(sep).join(posix.sep));
    }
  }
  return found;
}

for (const [name, subtrees] of [
  ['core', ['core', 'utils']],
  ['webgl2', ['core', 'utils', 'webgl2']],
  ['webgpu', ['core', 'utils', 'webgpu']],
]) {
  const lines = [
    `/* 自动生成（.tmp-14/gen-subentries.mjs）—— 只为 rollup 测量用，不入库、不影响发布产物。 */`,
  ];
  let count = 0;
  for (const subtree of subtrees) {
    const files = await collect(join(libmodules, subtree));
    files.sort();
    for (const file of files) {
      // 从 subentry-modules/gen-*.js 指向 libmodules/... 需要 `../libmodules/...`
      lines.push(`export * from '../libmodules/${file}';`);
      count += 1;
    }
  }
  const target = join(here, 'subentry-modules', `gen-${name}.js`);
  await writeFile(target, lines.join('\n') + '\n', 'utf8');
  console.log(`gen-${name}.js: ${count} 个模块`);
}

// 说明文件用不到，占位删掉可能残留的 ts 版本
console.log('done');
console.log(resolve(here, 'subentry-modules'));
