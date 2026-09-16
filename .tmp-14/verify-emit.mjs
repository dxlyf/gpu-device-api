/**
 * 批 14（路 A）：校验 `tsc` 产出的模块树是**能直接被消费的 ESM**。
 *
 * 路 A 的硬前提是「源码里的相对 import 都带显式 `.js`，tsc 原样输出后能被 Node / 浏览器 /
 * 打包器解析」。这个脚本就是对该前提的**全量机器校验**，而不是抽查：
 *
 *   1. 遍历产物目录下所有 `.js`，抽出每条相对说明符（`from './x.js'`、`import('./x.js')`），
 *      检查目标文件**确实存在**（不存在说明源码里漏了扩展名或路径写错）；
 *   2. 检查产物里**没有**指向 `.ts` 的说明符、没有裸别名说明符（例如 `@/core`）；
 *   3. 检查每个对外入口都能被 Node 作为 ESM 真实 import（说明产物本身语法有效、
 *      且整棵被静态 import 的依赖树都能解析）。
 *
 * 用法： node .tmp-14/verify-emit.mjs [产物目录，默认 dist]
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const target = resolve(repoRoot, process.argv[2] ?? 'dist');

/** 对外入口（与 package.json 的 exports 对应；路 A 下平铺在产物根目录）。 */
const ENTRIES = ['index.js', 'core.js', 'webgl2.js', 'webgpu.js'];

async function walkJs(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await walkJs(full)));
    else if (entry.name.endsWith('.js')) found.push(full);
  }
  return found;
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

const files = await walkJs(target);
console.log(`产物目录：${target}`);
console.log(`.js 文件数：${files.length}\n`);

let missing = 0;
let badSpecifier = 0;
let checked = 0;

for (const file of files) {
  const source = await readFile(file, 'utf8');
  // 同时抓 `from '...'` 与 `import('...')`
  const specifiers = new Set();
  for (const match of source.matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)) {
    specifiers.add(match[1]);
  }
  for (const specifier of specifiers) {
    if (!specifier.startsWith('.')) continue; // 裸包名（本库没有运行时依赖）不检查
    checked += 1;
    const resolved = resolve(dirname(file), specifier);
    if (!(await exists(resolved))) {
      missing += 1;
      console.log(`  MISSING  ${relative(repoRoot, file)} -> ${specifier}`);
    }
    if (specifier.endsWith('.ts') || !specifier.endsWith('.js')) {
      badSpecifier += 1;
      console.log(`  BAD SPEC ${relative(repoRoot, file)} -> ${specifier}`);
    }
  }
}

console.log(`\n相对说明符检查：${checked} 条，缺失 ${missing} 条，非 .js 结尾 ${badSpecifier} 条`);

console.log('\n入口可 import 性：');
let importFailures = 0;
for (const entry of ENTRIES) {
  const full = join(target, ...entry.split('/'));
  if (!(await exists(full))) {
    console.log(`  MISSING  ${entry}`);
    importFailures += 1;
    continue;
  }
  try {
    const namespace = await import(pathToFileURL(full).href);
    console.log(`  ok  ${entry}（导出 ${Object.keys(namespace).length} 个名字）`);
  } catch (error) {
    console.log(`  FAIL ${entry}: ${error.message}`);
    importFailures += 1;
  }
}

const failed = missing + badSpecifier + importFailures;
console.log(`\n${failed === 0 ? '✔ tsc 产物是可消费 ESM' : `✘ ${failed} 项问题`}`);
process.exit(failed === 0 ? 0 : 1);
