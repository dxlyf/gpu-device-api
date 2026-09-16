/**
 * 批 14 补充：同口径量一下库产物本身的体积（raw 与 gzip-9），
 * 并把 `dist/`（当前已提交的发布产物）与 `.tmp-14/` 两份临时构建放在一起对比。
 *
 * 只读，不写任何文件（除了 stdout）。
 */

import { readFile, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');

const targets = [
  ['dist/gpu-device-api.js（已提交的发布产物）', join(repoRoot, 'dist', 'gpu-device-api.js')],
  ['.tmp-14/libdist/gpu-device-api.js（本批单文件构建）', join(here, 'libdist', 'gpu-device-api.js')],
];

console.log('path, raw bytes, gzip-9 bytes');
for (const [label, file] of targets) {
  try {
    const buf = await readFile(file);
    console.log(`${label}: raw=${buf.length} gzip=${gzipSync(buf, { level: 9 }).length}`);
  } catch (error) {
    console.log(`${label}: (missing) ${String(error && error.message)}`);
  }
}

/** preserveModules 产物：模块数与总体积（未打包、未摇树，只作参考）。 */
try {
  const { readdir } = await import('node:fs/promises');
  const root = join(here, 'libmodules');
  let files = 0;
  let bytes = 0;
  const walk = async (dir) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.name.endsWith('.js')) {
        files += 1;
        bytes += (await stat(full)).size;
      }
    }
  };
  await walk(root);
  console.log(`.tmp-14/libmodules/: ${files} modules, raw=${bytes}`);
} catch {
  console.log('.tmp-14/libmodules/: (missing)');
}
