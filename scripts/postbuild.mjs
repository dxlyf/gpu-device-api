/**
 * Post-build fixups for the emitted type declarations.
 *
 * `tsc` drops `/// <reference types="@webgpu/types" />` from the generated `.d.ts` files, but the
 * public API mentions `GPUDevice` (the `Device.native` escape hatch). The directive is re-added to
 * the package entry so consumers get the WebGPU globals without configuring anything.
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
