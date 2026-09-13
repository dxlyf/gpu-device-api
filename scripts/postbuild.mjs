/**
 * 针对生成的类型声明的构建后修补。
 *
 * `tsc` 会从生成的 `.d.ts` 文件中丢弃 `/// <reference types="@webgpu/types" />`，但公开 API
 * 提及了 `GPUDevice`（即 `Device.native` 这个逃生口）。该指令会被重新添加到包入口，
 * 使使用方无需任何配置即可获得 WebGPU 全局类型。
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const entry = join(root, 'dist', 'types', 'index.d.ts');
const reference = '/// <reference types="@webgpu/types" />\n';

const source = await readFile(entry, 'utf8');
if (!source.startsWith(reference)) {
  await writeFile(entry, reference + source, 'utf8');
  console.log('[postbuild] added the @webgpu/types reference to dist/types/index.d.ts');
} else {
  console.log('[postbuild] dist/types/index.d.ts already references @webgpu/types');
}
