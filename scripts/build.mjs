/**
 * 库构建（批 14 起改为**路 A：tsc 直接输出模块树**）。
 *
 * 为什么不打包（决策与三种打包器的实测见 `.tmp-14/RESULT.md`）：
 *
 * 1. **打包器产物救不了「只用 WebGL2」的使用方**。实测（rollup 4.63 / esbuild 0.21 / vite 5.4）：
 *    单文件 ESM + `"sideEffects": false` 下，只用 WebGL2 的消费方产物体积与「两个后端都要」
 *    **逐字节相同**（差值 −2 字节，就是那处 `'webgl2'` / `'auto'` 字符串），且产物里
 *    WebGPU 后端的完整符号全部在位。因为 `src/factories/default-registry.ts` 静态 import 了
 *    两个后端的 Adapter，而 `backend: 'webgl2'` 是运行时字符串，打包器摇不掉。
 * 2. **模块树让消费方的打包器按模块粒度静态分析**，于是「只用 WebGL2」的消费方天然不会
 *    带上 WebGPU 后端的任何模块 —— 这是该问题的正解，而不是靠「切入口」绕过它。
 * 3. 硬前提本仓库**已经满足**：所有相对 import 都带显式 `.js` 扩展名
 *    （`node .tmp-14/verify-emit.mjs` 全量校验：552 条相对说明符、0 条缺失、0 条非 `.js`），
 *    所以 `tsc` 原样输出的就是可直接消费的 ESM，**不需要说明符重写、不需要生成脚本**。
 *
 * 本脚本只做两件事：
 *   1. 清空 `dist/`，跑 `tsc -p tsconfig.build.json`
 *      （一次产出：每个源文件一个 `.js`，外加对应的 `.d.ts` 与两类 `.map`）；
 *   2. `scripts/postbuild.mjs` 给每个对外入口的 `.d.ts` 补 `@webgpu/types` reference
 *      （tsc 会丢掉源码里的 `/// <reference>`）。
 *
 * ⚠️ 不再有 `vite build`：`vite.config.ts` 只保留 dev server（示例页），
 * 库构建完全不经过打包器。要单文件 bundle 的使用方请自行打包（这是刻意不做的事，
 * 理由见上面第 1、2 条）。
 */

import { rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(root, 'package.json'));

/**
 * 直接定位 typescript 自己的 CLI 并用 `node` 跑。
 * 不用 `pnpm exec` / `npx`：本仓库是 pnpm 工作区，`node_modules/.bin/*` 只有在
 * pnpm 提供的 PATH 下才存在，而这里是从 `node scripts/build.mjs` 直接起来的。
 * 也不用 `require.resolve('typescript/bin/tsc')`：那是个无扩展名的 shell 包装。
 */
const typescriptDir = dirname(require.resolve('typescript/package.json'));
const TSC_CLI = join(typescriptDir, 'lib', 'tsc.js');

function run(args) {
  // stdio 一律 inherit：不通过管道抓子进程输出（这也让沙箱下的行为与终端一致）。
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error(`[build] 命令失败（exit ${result.status}）：node ${args.join(' ')}`);
  }
}

/** 先清空 dist：tsc 不会删掉「源文件已删除」留下的旧产物。 */
await rm(join(root, 'dist'), { recursive: true, force: true });

console.log('[build] tsc -p tsconfig.build.json（模块树 + 类型声明）');
let tscFailed = false;
try {
  run([TSC_CLI, '-p', 'tsconfig.build.json']);
} catch (error) {
  // tsc 失败时仍然往下走：否则 postbuild 不执行，dist/ 会停在「没有 reference」的半成品状态。
  // 但退出码必须是失败 —— 产物不完整时不能让 CI 认为是绿的。
  tscFailed = true;
  console.error(`\n[build] ⚠️  tsc 失败：${error.message}`);
}

console.log('\n[build] postbuild');
run([join(root, 'scripts', 'postbuild.mjs')]);

if (tscFailed) {
  console.error('\n[build] 失败：模块树 / 类型声明未完整生成（原因见上面 tsc 的输出）。');
  process.exit(1);
}
console.log('\n[build] 完成');
