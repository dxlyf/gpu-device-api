/**
 * 针对生成的类型声明的构建后修补。
 *
 * `tsc` 会从生成的 `.d.ts` 文件中丢弃 `/// <reference types="@webgpu/types" />`，但公开 API
 * 提及了 `GPUDevice`（即 `Device.native` 这个逃生口）。该指令会被重新添加到**每一个对外入口**
 * 的声明文件上，使使用方无论从主入口还是子入口导入，都无需任何配置就能获得 WebGPU 全局类型。
 *
 * 入口清单是**固定的小列表**（不是遍历生成）：与 `package.json` 的 `exports`、
 * `test/entry-surface-dist.test.ts` 里的表一一对应；新增子入口时三处一起改。
 *
 * 批 14 起产物是「模块树」（每源文件一个 `.js`），对外入口就是 `src/` 根下的
 * `index.ts` / `core.ts` / `webgl2.ts` / `webgpu.ts`，因此声明文件平铺在 `dist/` 根下
 * （没有 `entries/` 子目录，也没有 `dist/types/`）。
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const reference = '/// <reference types="@webgpu/types" />\n';

/** 对外入口的声明文件（相对 `dist/` 的路径），按 `[入口名, 路径]` 排列。 */
const ENTRY_DECLARATIONS = [
  ['index', 'index.d.ts'],
  ['core', 'core.d.ts'],
  ['webgl2', 'webgl2.d.ts'],
  ['webgpu', 'webgpu.d.ts'],
];

let changed = 0;
let already = 0;
for (const [name, relative] of ENTRY_DECLARATIONS) {
  const entry = join(root, 'dist', relative);
  let source;
  try {
    source = await readFile(entry, 'utf8');
  } catch (error) {
    throw new Error(`[postbuild] 找不到入口声明 ${entry}（入口 "${name}"）：${error.message}`);
  }
  if (source.startsWith(reference)) {
    already += 1;
    continue;
  }
  await writeFile(entry, reference + source, 'utf8');
  changed += 1;
}
console.log(
  `[postbuild] @webgpu/types reference：新增 ${changed} 个入口，已存在 ${already} 个（共 ${ENTRY_DECLARATIONS.length} 个入口）`,
);
