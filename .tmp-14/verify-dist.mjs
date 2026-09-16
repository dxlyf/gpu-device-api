/**
 * 批 14：对**真实发布产物** `dist/*.js` 做冒烟验证（不是源码，也不是临时构建）。
 *
 * 检查三件事：
 * 1. 四个入口文件都在，能作为 ESM 被 import（说明没有语法错误 / 没有指向不存在的 chunk）；
 * 2. 每个入口导出的运行时符号与 `test/entry-points.test.ts` 的契约一致 ——
 *    尤其 `/webgl2` 产物里**不得**出现 WebGPU 后端的符号（反之亦然）；
 * 3. 产物里没有 `import ... from './xxxx-hash.js'` 这种公共 chunk 引用 ——
 *    即「每个入口都是自包含单文件」这条发布形态约束。
 *
 * 用法： node .tmp-14/verify-dist.mjs
 * 依赖：先跑 `node scripts/build.mjs`（产物会写到仓库 dist/）。
 */

import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const distDir = join(here, '..', 'dist');

const ENTRIES = [
  {
    file: 'gpu-device-api.js',
    mustHave: ['createDevice', 'createDeviceWithAdapter', 'Renderer', 'BackendRegistry', 'BufferUsage'],
    mustNotHave: [],
  },
  {
    file: 'core.js',
    mustHave: ['BufferUsage', 'CompareFunction', 'ValidationError'],
    mustNotHave: ['WebGPUAdapter', 'WebGL2Adapter', 'createDevice'],
  },
  {
    file: 'webgl2.js',
    mustHave: ['WebGL2Adapter', 'WebGL2Device', 'BufferUsage', 'ValidationError'],
    mustNotHave: ['WebGPUAdapter', 'WebGPUDevice', 'WebGPURenderPipeline', 'createDevice'],
  },
  {
    file: 'webgpu.js',
    mustHave: ['WebGPUAdapter', 'WebGPUDevice', 'BufferUsage', 'ValidationError'],
    mustNotHave: ['WebGL2Adapter', 'WebGL2Device', 'WebGL2RenderPipeline', 'createDevice'],
  },
];

let failures = 0;
function check(ok, message) {
  console.log(`${ok ? '  ok  ' : '  FAIL'} ${message}`);
  if (!ok) failures += 1;
}

console.log(`dist 目录：${distDir}\n`);
const files = await readdir(distDir);
console.log(`dist/ 顶层文件：${files.filter((name) => name.endsWith('.js')).join(', ')}\n`);

for (const entry of ENTRIES) {
  console.log(`[${entry.file}]`);
  const full = join(distDir, entry.file);
  const source = await readFile(full, 'utf8');

  // 2) 自包含：不允许出现指向本目录其它 .js 的相对 import
  const relativeImports = [...source.matchAll(/from\s+["']\.\/[^"']+\.js["']/g)].map((match) => match[0]);
  check(relativeImports.length === 0, `自包含（相对 import 数 = ${relativeImports.length}）${relativeImports.slice(0, 3).join(' ')}`);

  // 3) 运行时导出面
  const namespace = await import(pathToFileURL(full).href);
  for (const name of entry.mustHave) {
    check(name in namespace, `导出 ${name}`);
  }
  for (const name of entry.mustNotHave) {
    check(!(name in namespace), `不导出 ${name}`);
  }

  // 1) 补充：WebGPU 专有标识符在 /core、/webgl2 产物里不应出现（源码级兜底，防止只被 export 隐藏）
  if (entry.file === 'core.js' || entry.file === 'webgl2.js') {
    for (const marker of ['WebGPUAdapter', 'WebGPUDevice', 'requestWebGPUAdapter', 'preferredCanvasFormat']) {
      check(!source.includes(marker), `产物文本不含 ${marker}`);
    }
  }
  if (entry.file === 'webgpu.js') {
    for (const marker of ['WebGL2Adapter', 'WebGL2Device', 'GlStateCache']) {
      check(!source.includes(marker), `产物文本不含 ${marker}`);
    }
  }
  console.log('');
}

/** 类型声明：每个入口都要有 .d.ts，且带 @webgpu/types reference。 */
const TYPES = [
  ['types/index.d.ts', 'index'],
  ['types/entries/core.d.ts', 'core'],
  ['types/entries/webgl2.d.ts', 'webgl2'],
  ['types/entries/webgpu.d.ts', 'webgpu'],
];
console.log('[类型声明]');
for (const [relative, name] of TYPES) {
  const declaration = await readFile(join(distDir, relative), 'utf8');
  check(declaration.startsWith('/// <reference types="@webgpu/types" />'), `${relative} 带 @webgpu/types reference（入口 ${name}）`);
  check(declaration.length > 0, `${relative} 非空`);
}

console.log(`\n${failures === 0 ? '✔ dist 冒烟验证全部通过' : `✘ ${failures} 项失败`}`);
process.exit(failures === 0 ? 0 : 1);
