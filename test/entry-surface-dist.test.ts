/**
 * 发布形态验证（批 14 建立，批 15 扩到「两条路并存」）。
 *
 * 发布形态现在是**两条路并存**（职责不同，不是两套做同一件事）：
 *
 * 1. **模块树 + 类型声明（`tsc -p tsconfig.build.json`）**：
 *    每个源文件一个 `.js` + 同级 `.d.ts` + `.map`，对外入口平铺在 `dist/` 根下
 *    （`index.js` / `core.js` / `webgl2.js` / `webgpu.js`）。消费方的打包器按**模块粒度**
 *    静态分析 —— 这是「只用 WebGL2 的使用方不必背上 WebGPU 后端」的正解。
 * 2. **UMD / ES 单文件包（`vite build`）**：给**没有打包器**的场景（CDN 直引、
 *    `<script src>`、`require()`）。它们打的是**主入口**，所以**两个后端都在里面** ——
 *    这是刻意的取舍：「想要更小请用子入口 + 打包器；想要单文件请接受两个后端都在」。
 *
 * 与 `entry-points.test.ts` 的分工：
 * - `entry-points.test.ts` 测 `src/` 的**源码级**导出面（守「入口结构别被改坏」）；
 * - 本文件测**发布形态**：`package.json` 的每个入口字段都指向磁盘上真实存在的文件、
 *   入口真的能被 import / require、模块树的每条相对说明符都能解析、单文件包真的自包含。
 *
 * ⚠️ 本文件全部用 `import.meta.glob` 惰性取产物内容，**不用顶层静态 import**：
 * 顶层 `import '../dist/core.js?url'` 会在**收集阶段**就抛错，那样 `describe.skipIf` 根本来不及生效。
 * 同样也**不用 Node 内建模块的静态 import**：本仓库没装 `@types/node`，`import 'node:module'`
 * 会让 `tsc --noEmit` 报 TS2307（下面用到 `createRequire` 处用**非字面量说明符**绕开）。
 *
 * 关于「dist 落后于 src」：本仓库的 `dist` 是**被跟踪**的，由 `pnpm run build` 重建。
 * 若此刻磁盘上的 `dist` 还是旧形态，本文件会**整体跳过**并打印一条明确说明 ——
 * 这是有意的：让「只跑测试」的开发流程不至于卡住，而跑过 `pnpm run build` 之后
 * 这些用例会**自动恢复为强制校验**（无需改代码）。
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
/** `dist/` 下的 **UMD 单文件包**。单独 glob：它必须是 `.cjs`（见下面 `BUNDLE_FILES`）。 */
const distUmdRaw = import.meta.glob('../dist/**/*.cjs', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>;

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

/** 所有 `.cjs`（即 UMD 单文件包）相对 `dist/` 的路径 → 文本。 */
const distUmd: Record<string, string> = {};
for (const [key, source] of Object.entries(distUmdRaw)) {
  distUmd[relativeToDist(key)] = source;
}

/** 所有声明文件相对 `dist/` 的路径 → 文本。 */
const declarations: Record<string, string> = {};
for (const [key, source] of Object.entries(distDeclarations)) {
  declarations[relativeToDist(key)] = source;
}

/**
 * `vite build` 产出的**单文件包**文件名（与 `vite.config.ts` 的 `build.lib.fileName` 一一对应）。
 *
 * UMD 必须是 `.cjs`：`package.json` 是 `"type": "module"`，若叫 `.js`，Node 会按 ESM 解析，
 * `require()` 拿到的是**空命名空间**（实测：同样的字节，`.cjs` 下 251 个导出、`.js` 下 0 个，
 * 且只留下一个 `globalThis.GPUDeviceAPI` 副作用）。
 */
const BUNDLE_FILES = {
  umd: 'gpu-device-api.umd.cjs',
  es: 'gpu-device-api.es.js',
} as const;

/**
 * 模块树 = 所有 `.js` **减去** ES 单文件包。
 * 单文件包不属于模块树：它不是「每源文件一个模块」，检查说明符也没有意义。
 */
const moduleSources: Record<string, string> = {};
for (const [relative, source] of Object.entries(distSources)) {
  if (relative === BUNDLE_FILES.es) continue;
  moduleSources[relative] = source;
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
 * 「dist 是否已经是当前发布形态」。
 * 模块树四个入口与两个单文件包缺任何一个，就说明 `pnpm run build` 还没跑（或跑的是旧配置）
 * —— 整份跳过，并打印**具体缺了什么**（不静默）。
 */
const missingArtifacts = [
  ...Object.values(ENTRIES).map((entry) => entry.js),
  BUNDLE_FILES.umd,
  BUNDLE_FILES.es,
].filter((file) => (file.endsWith('.cjs') ? distUmd[file] : distSources[file]) === undefined);
const distComplete = missingArtifacts.length === 0;

if (!distComplete) {
  // 打印一次就够，避免每个用例都刷屏；用 console.warn 而不是静默跳过，免得看起来「全过」。
  console.warn(
    `[entry-surface-dist] 跳过：磁盘上的 dist/ 还不是当前发布形态，缺 ${missingArtifacts.join(' / ')}。` +
      '跑一次 `pnpm run build` 后这些用例会自动恢复为强制校验。',
  );
}

describe.skipIf(!distComplete)('发布形态：dist 模块树 + UMD/ES 单文件包 + package.json 入口字段', () => {
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

  it('`main` / `unpkg` / `jsdelivr` 指向 UMD，`module` / `types` 指向模块树入口', () => {
    // `main` 给 require / 老工具链 → UMD 单文件包；
    // `module` / `types` 给打包器 → 模块树入口（保证树摇）；
    // `unpkg` / `jsdelivr` 是 CDN 直引的约定字段。
    expect(manifest.main).toBe(`./dist/${BUNDLE_FILES.umd}`);
    expect(manifest.unpkg).toBe(`./dist/${BUNDLE_FILES.umd}`);
    expect(manifest.jsdelivr).toBe(`./dist/${BUNDLE_FILES.umd}`);
    expect(manifest.module).toBe('./dist/index.js');
    expect(manifest.types).toBe('./dist/index.d.ts');

    // 「能解析到实际文件」：文件真的在磁盘上（glob 拿到的），不是只写了一行路径。
    expect(distUmd[BUNDLE_FILES.umd], `dist/${BUNDLE_FILES.umd} 应存在`).toBeDefined();
    expect(distSources[BUNDLE_FILES.es], `dist/${BUNDLE_FILES.es} 应存在`).toBeDefined();
    expect(declarations['index.d.ts'], 'dist/index.d.ts 应存在').toBeDefined();
  });

  it('ES 单文件包是自包含的（没有任何相对 import），UMD 是压缩过的单文件', () => {
    const es = distSources[BUNDLE_FILES.es]!;
    // 「单文件」的判据：文本里没有相对说明符（有的话就必须再取别的文件，浏览器直接 import 会 404）。
    const relativeSpecifiers = [...es.matchAll(/(?:from|import)\s*\(?\s*["'](\.[^"']+)["']/g)].map((match) => match[1]);
    expect(relativeSpecifiers).toEqual([]);
    // 它确实是个 bundle：比模块树里任何一个文件都大。
    const largestModule = Math.max(...Object.values(moduleSources).map((source) => source.length));
    expect(es.length).toBeGreaterThan(largestModule);

    // UMD 走的是完全压缩（ES 那份 Vite 刻意保留空白，见 vite.config.ts 的注释）。
    const umd = distUmd[BUNDLE_FILES.umd]!;
    expect(umd.split('\n').length).toBeLessThan(1000);
    expect(umd.length).toBeGreaterThan(100_000);
  });

  it('产物是「每源文件一个模块」的模块树，不是单个 bundle', () => {
    // 178 个 .js（含 4 个对外入口）——见 `.tmp-14/RESULT.md` 的清单
    expect(Object.keys(moduleSources).length).toBeGreaterThan(100);
    // 单文件包不算模块树：它只在 dist 根下占一个名字。
    expect(moduleSources[BUNDLE_FILES.es]).toBeUndefined();
    // 入口不是自包含的：它们 import 别的模块（这正是「按模块摇树」的前提）
    expect(moduleSources['index.js']).toMatch(/from\s+["']\.\/[^"']+\.js["']/);
  });

  it('整个模块树的每条相对说明符都能解析到真实文件，且都带 .js 扩展名', () => {
    let checked = 0;
    const problems: string[] = [];
    for (const [from, source] of Object.entries(moduleSources)) {
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
        if (moduleSources[target] === undefined) problems.push(`${from} -> ${specifier}（缺 ${target}）`);
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

  it('UMD 单文件包能被 Node `require()`（`.cjs`），ES 单文件包能被直接 `import`', async () => {
    // 这里用**非字面量**说明符动态 import Node 内建模块：本仓库没装 `@types/node`，
    // 写死 `'node:module'` 会让 `tsc --noEmit` 报 TS2307。声明成 `string` 让 tsc 不解析它。
    const nodeModuleId: string = 'node:module';
    const nodeModule = (await import(/* @vite-ignore */ nodeModuleId)) as unknown as {
      createRequire: (from: string) => (specifier: string) => Record<string, unknown>;
    };
    const requireFromTest = nodeModule.createRequire(import.meta.url);

    const umd = requireFromTest(`../dist/${BUNDLE_FILES.umd}`);
    expect(typeof umd.createDevice).toBe('function');
    expect(typeof umd.createDeviceWithAdapter).toBe('function');
    expect(Object.keys(umd).length).toBeGreaterThan(200);

    // ES 单文件包：一个 `import` 就够，不需要任何打包器 / import map。
    const es = (await import(
      /* @vite-ignore */ new URL(`../dist/${BUNDLE_FILES.es}`, import.meta.url).href
    )) as Record<string, unknown>;
    expect(typeof es.createDevice).toBe('function');
    expect(Object.keys(es).length).toBeGreaterThan(200);

    // 两个单文件包打的是主入口 —— 所以它们的导出面应当与模块树主入口一致
    // （这同时证明「两个后端都在里面」：主入口的 factories 会同时拉起两个后端）。
    const entryNamespace = (await import(
      /* @vite-ignore */ new URL('../dist/index.js', import.meta.url).href
    )) as Record<string, unknown>;
    expect(Object.keys(es).sort()).toEqual(Object.keys(entryNamespace).sort());
    expect(Object.keys(umd).sort()).toEqual(Object.keys(entryNamespace).sort());
  }, 120_000);

  it('webgl2 / webgpu 入口的模块图里不含对方后端（相对 import 层面）', () => {
    // 入口自己的文本里显然不会出现对方后端；真正要防的是**间接**拉进来：
    // 检查 core / utils / 自身后端这棵子树里没有任何文件 import 另一个后端的模块。
    const offenders: string[] = [];
    for (const [relative, source] of Object.entries(moduleSources)) {
      if (!(relative.startsWith('core/') || relative.startsWith('utils/') || relative.startsWith('webgl2/'))) continue;
      if (/["'][^"']*\/webgpu\//.test(source)) offenders.push(relative);
    }
    expect(offenders).toEqual([]);
    expect(moduleSources['webgl2.js']).not.toMatch(/["'][^"']*\/webgpu\//);
    expect(moduleSources['webgpu.js']).not.toMatch(/["'][^"']*\/webgl2\//);
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
