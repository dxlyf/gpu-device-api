/**
 * 校验工具：确认改动只修改了注释，没有动过任何代码。
 *
 * 做法：对每个相对基线有改动的文件，把基线版本和工作区版本分别做「去注释 + 空白归一化」，
 * 然后逐字符比较。只要有任何标识符、字符串字面量、运算符或语句顺序被改动，就会报告出来。
 *
 * 用法：
 *   node scripts/verify-comments-only.mjs            # 基线为 HEAD
 *   node scripts/verify-comments-only.mjs HEAD~1     # 基线为上一次提交
 */
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const base = process.argv[2] ?? 'HEAD';

/** 去掉行注释与块注释，保留字符串字面量。 */
function stripComments(source) {
  let out = '';
  let i = 0;
  const n = source.length;
  let state = 'code'; // code | line | block | single | double | template
  while (i < n) {
    const c = source[i];
    const next = source[i + 1];
    if (state === 'code') {
      if (c === '/' && next === '/') {
        state = 'line';
        i += 2;
        continue;
      }
      if (c === '/' && next === '*') {
        state = 'block';
        i += 2;
        continue;
      }
      if (c === "'") state = 'single';
      else if (c === '"') state = 'double';
      else if (c === '`') state = 'template';
      out += c;
      i += 1;
      continue;
    }
    if (state === 'line') {
      if (c === '\n') {
        state = 'code';
        out += c;
      }
      i += 1;
      continue;
    }
    if (state === 'block') {
      if (c === '*' && next === '/') {
        state = 'code';
        i += 2;
        continue;
      }
      // 块注释换行时补一个空格，避免把相邻 token 粘连。
      if (c === '\n') out += ' ';
      i += 1;
      continue;
    }
    // 字符串状态：处理转义，遇到闭合引号回到 code。
    if (c === '\\') {
      out += c + (next ?? '');
      i += 2;
      continue;
    }
    if (
      (state === 'single' && c === "'") ||
      (state === 'double' && c === '"') ||
      (state === 'template' && c === '`')
    ) {
      state = 'code';
    }
    out += c;
    i += 1;
  }
  return out;
}

/** 归一化空白，使纯格式差异不影响比较。 */
function normalize(source) {
  return stripComments(source)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');
}

const CODE_EXTENSIONS = new Set(['.ts', '.mjs', '.js', '.json']);
const changed = execFileSync('git', ['diff', '--name-only', 'HEAD'], { cwd: root, encoding: 'utf8' })
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);

let failures = 0;
let checked = 0;

for (const file of changed) {
  if (!CODE_EXTENSIONS.has(extname(file))) {
    console.log(`跳过（非代码文件）: ${file}`);
    continue;
  }
  let head;
  try {
    head = execFileSync('git', ['show', `HEAD:${file}`], { cwd: root, encoding: 'utf8' });
  } catch {
    console.log(`新增文件（无 HEAD 版本）: ${file}`);
    continue;
  }
  const working = await readFile(join(root, file), 'utf8');
  checked += 1;
  const before = normalize(head);
  const after = normalize(working);
  if (before === after) {
    console.log(`OK   代码未变: ${file}`);
    continue;
  }
  failures += 1;
  console.log(`FAIL 代码被改动: ${file}`);
  const a = before.split('\n');
  const b = after.split('\n');
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) {
      console.log(`      第 ${i + 1} 行`);
      console.log(`        HEAD : ${a[i] ?? '<无>'}`);
      console.log(`        现在 : ${b[i] ?? '<无>'}`);
      break;
    }
  }
}

console.log('');
if (failures === 0) {
  console.log(`通过：${checked} 个代码文件的非注释内容与 HEAD 完全一致。`);
} else {
  console.log(`失败：${failures}/${checked} 个文件在注释之外还有改动。`);
  process.exitCode = 1;
}
