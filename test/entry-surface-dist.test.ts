/**
 * 批 14：`dist/` 发布形态验证（真实产物 + `package.json` 的 `exports` 声明）。
 *
 * 产物形态（路 A）：`tsc` 直接把整个模块树输出到 `dist/`，**每个源文件一个 `.js`**，
 * 对外入口平铺在 `dist/` 根下：`index.js` / `core.js` / `webgl2.js` / `webgpu.js`。
 *
 * 与 `entry-points.test.ts` 的分工：
 * - `entry-points.test.ts` 测 `src/` 的**源码级**导出面（守「入口结构别被改坏」）；
 * - 本文件测**发布形态**：`exports` 指向的文件真的存在、真的能被 import、真的导出该导出的东西，
 *   以及**整个模块树的相对说明符都能解析**（这是路 A「不打包」的核心不变量 ——
 *   源码里每条 `from './x.js'` 都对应磁盘上一个真实文件）。
 *
 * ⚠️ 本文件全部用 `import.meta.glob` 惰性取产物内容，**不用顶层静态 import**：
 * 顶层 `import '../dist/core.js?url'` 会在**收集阶段**就抛错，那样 `describe.skipIf` 根本来不及生效。
 * 同样也**不用任何 Node 内建模块**：本仓库没装 `@types/node`，用 `node:fs` 会让
 * `tsc --noEmit` 报 TS2307。
 *
 * 关于「dist 落后于 src」：本仓库的 `dist` 是**被跟踪**的，由 `pnpm run build` 重建。
 * 若此刻磁盘上的 `dist` 还是旧形态（批 14 之前的单文件 bundle），本文件会**整体跳过**
 * 并打印一条明确说明 —— 这是有意的：让「只跑测试」的开发流程不至于卡住，
 * 而 CI 里跑过 `pnpm run build` 之后这些用例会**自动恢复为强制校验**（无需改代码）。
 */

import { describe, expect, it } from 'vitest';

import manifest from '../package.json';

/** `dist/` 下所有 `.js`（含声明与 map；后面显式筛掉）。 */
const distRaw = import.meta.glob('../dist/**/*.js', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>;
/** `dist/` 下所有声明文件。 */
const distDeclarations = import.meta.glob('../dist/**/*.d.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** 去掉 `../dist/` 前缀，得到相对 `dist/` 的 posix 路径。 */
function relativeToDist(key: string): string {
  return key.replace(/^\.\.\/dist\//, '');
}

/** 产物里所有 `.js`（排除声明文件与 sourcemap）相对 `dist/` 的路径 → 源码文本。 */
const distSources: Record<string, string> = {};
for (const [key, source] of Object.entries(distRaw)) {
  const relative = relativeToDist(key);
  if (relative.endsWith('.d.ts') || relative.endsWith('.map')) continue;
  distSources[relative] = source;
}

/** 所有声明文件相对 `dist/` 的路径 → 文本。 */
const declarations: Record<string, string> = {};
for (const [key, source] of Object.entries(distDeclarations)) {
  declarations[relativeToDist(key)] = source;
}

/**
 * 入口（`package.json` 的 `exports` 子路径）→ 产物文件与声明文件。
 * 这张表会被下面的用例**反向比对** `package.json`，所以不是「抄一遍就完事」。
 */
const ENTRIES = {
  '.': {
    js: 'index.js',
    declaration: 'index.d.ts',
    expected: [
      'createDevice',
      'createDeviceWithAdapter',
      'createDefaultBackendRegistry',
      'BackendRegistry',
      'detectBackend',
      'Renderer',
      'PerspectiveCamera',
      'OrbitControls',
      'shapes',
      'materials',
      'BufferUsage',
    ],
    forbidden: [] as string[],
  },
  './core': {
    js: 'core.js',
    declaration: 'core.d.ts',
    expected: ['BufferUsage', 'CompareFunction', 'ValidationError'],
    forbidden: ['createDevice', 'WebGPUAdapter', 'WebGL2Adapter', 'WebGPURenderPipeline'],
  },
  './webgl2': {
    js: 'webgl2.js',
    declaration: 'webgl2.d.ts',
    expected: ['WebGL2Adapter', 'WebGL2Device', 'BufferUsage', 'ValidationError'],
    forbidden: ['createDevice', 'WebGPUAdapter', 'WebGPUDevice', 'WebGPURenderPipeline'],
  },
  './webgpu': {
    js: 'webgpu.js',
    declaration: 'webgpu.d.ts',
    expected: ['WebGPUAdapter', 'WebGPUDevice', 'BufferUsage', 'ValidationError'],
    forbidden: ['createDevice', 'WebGL2Adapter', 'WebGL2Device', 'WebGL2RenderPipeline'],
  },
};

/**
 * 「dist 是否已经是路 A 的形态」。
 * 四个入口文件缺任何一个，就说明 `pnpm run build` 还没跑（或跑的是旧配置）——整份跳过。
 */
const distEntriesPresent = Object.values(ENTRIES).every((entry) => distSources[entry.js] !== undefined);

if (!distEntriesPresent) {
  // 打印一次就够，避免每个用例都刷屏；用 console.warn 而不是静默跳过，免得看起来「全过」。
  console.warn(
    '[entry-surface-dist] 跳过：磁盘上的 dist/ 还不是路 A 的模块树形态' +
      '（缺 dist/index.js / core.js / webgl2.js / webgpu.js 之一）。' +
      '跑一次 `pnpm run build` 后这些用例会自动恢复为强制校验。',
  );
}

describe.skipIf(!distEntriesPresent)('批 14：dist 模块树与 package.json exports（发布形态）', () => {
  it('exports 的四个子路径都在，且 import / types 指向的产物文件确实存在', () => {
    expect(Object.keys(manifest.exports).sort()).toEqual(Object.keys(ENTRIES).sort());

    for (const [subpath, entry] of Object.entries(ENTRIES)) {
      const exported = manifest.exports[subpath as keyof typeof manifest.exports] as { types: string; import: string };
      expect(exported.import, `exports["${subpath}"].import`).toBe(`./dist/${entry.js}`);
      expect(exported.types, `exports["${subpath}"].types`).toBe(`./dist/${entry.declaration}`);
      expect(distSources[entry.js], `dist/${entry.js} 应存在`).toBeDefined();
      expect(declarations[entry.declaration], `dist/${entry.declaration} 应存在`).toBeDefined();
    }
  });

  it('`main` 指向 UMD 单文件包（`module` / `types` 仍指向模块树入口）', () => {
    // 批 15：`main` 服务于 `require()` / 老工具链，因此指向 `vite build` 产出的 UMD 单文件包；
    // 打包器走的 `module` / `types` 仍指向模块树入口（保证树摇）。
    // UMD 必须落在 `.cjs`：`package.json` 是 `"type": "module"`，同名 `.js` 会被当成 ESM 解析，
    // `require()` 拿到的是**空命名空间**（实测见 `.tmp-15/RESULT.md`）。
    expect(manifest.main).toBe('./dist/gpu-device-api.umd.cjs');
    expect(manifest.module).toBe('./dist/index.js');
    expect(manifest.types).toBe('./dist/index.d.ts');
  });

  it('产物是「每源文件一个模块」的模块树，不是单个 bundle', () => {
    // 178 个 .js（含 4 个对外入口）——见 `.tmp-14/RESULT.md` 的清单
    expect(Object.keys(distSources).length).toBeGreaterThan(100);
    // 入口不是自包含的：它们 import 别的模块（这正是「按模块摇树」的前提）
    expect(distSources['index.js']).toMatch(/from\s+["']\.\/[^"']+\.js["']/);
  });

  it('整个模块树的每条相对说明符都能解析到真实文件，且都带 .js 扩展名', () => {
    let checked = 0;
    const problems: string[] = [];
    for (const [from, source] of Object.entries(distSources)) {
      for (const match of source.matchAll(/(?:from|import)\s*\(?\s*["'](\.[^"']+)["']/g)) {
        const specifier = match[1]!;
        checked += 1;
        if (!specifier.endsWith('.js')) problems.push(`${from} -> ${specifier}（不是 .js）`);
        // 把说明符相对 from 解析成相对 dist/ 的路径（都是 `./x.js` 或 `../y/z.js`）
        const baseParts = from.split('/').slice(0, -1);
        for (const part of specifier.split('/')) {
          if (part === '.' || part === '') continue;
          if (part === '..') baseParts.pop();
          else baseParts.push(part);
        }
        const target = baseParts.join('/');
        if (distSources[target] === undefined) problems.push(`${from} -> ${specifier}（缺 ${target}）`);
      }
    }
    expect(problems).toEqual([]);
    expect(checked).toBeGreaterThan(400);
  });

  it('每个入口都能被真实 import，且导出面符合契约（子入口不含另一个后端）', async () => {
    // 用 `new URL(..., import.meta.url)` 让运行时解析真实文件路径，
    // 而不是写死 `import('../dist/index.js')` —— 后者在没有 `dist` 时连 `tsc --noEmit`
    // 都会报 TS2307（本仓库没装 @types/node，也不该为一个可选产物加类型桩）。
    const load = (file: string): Promise<Record<string, unknown>> =>
      import(/* @vite-ignore */ new URL(`../dist/${file}`, import.meta.url).href) as Promise<Record<string, unknown>>;

    for (const [subpath, entry] of Object.entries(ENTRIES)) {
      const namespace = await load(entry.js);
      for (const name of entry.expected) {
        expect(namespace, `${subpath} 应导出 ${name}`).toHaveProperty(name);
      }
      for (const name of entry.forbidden) {
        expect(namespace, `${subpath} 不应导出 ${name}`).not.toHaveProperty(name);
      }
    }
  }, 120_000);

  it('webgl2 / webgpu 入口的模块图里不含对方后端（相对 import 层面）', () => {
    // 入口自己的文本里显然不会出现对方后端；真正要防的是**间接**拉进来：
    // 检查 core / utils / 自身后端这棵子树里没有任何文件 import 另一个后端的模块。
    const offenders: string[] = [];
    for (const [relative, source] of Object.entries(distSources)) {
      if (!(relative.startsWith('core/') || relative.startsWith('utils/') || relative.startsWith('webgl2/'))) continue;
      if (/["'][^"']*\/webgpu\//.test(source)) offenders.push(relative);
    }
    expect(offenders).toEqual([]);
    expect(distSources['webgl2.js']).not.toMatch(/["'][^"']*\/webgpu\//);
    expect(distSources['webgpu.js']).not.toMatch(/["'][^"']*\/webgl2\//);
  });

  it('每个入口的 .d.ts 都带 @webgpu/types reference（子入口也要有）', () => {
    for (const [subpath, entry] of Object.entries(ENTRIES)) {
      expect(
        declarations[entry.declaration]!.startsWith('/// <reference types="@webgpu/types" />'),
        `${subpath} 的 .d.ts 应带 reference`,
      ).toBe(true);
    }
  });
});
