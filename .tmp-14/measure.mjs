/**
 * 批 14 第一步测量：一个「只用 WebGL2」的最小消费方，是否已经把整个 WebGPU 后端打进自己的 bundle？
 *
 * 判定方法（可判定，不靠体积猜）：
 *   1. C1 与 C3 是**逐行相同、只差 `backend: 'webgl2'` / `'auto'` 一处字符串**的对照组；
 *   2. 用三种真实打包器（rollup / esbuild / vite）各自打包同构的模块图；
 *   3. 在产物里搜**只可能由 WebGPU 后端产生**的完整符号，并用 WebGL2 的对照符号
 *      证明「搜索本身有效」（否则满屏 `-` 是假阴性）；
 *   4. 给出**原始字节 / gzip 字节**；
 *   5. C4/C5/C6 是子入口探针，用来量「切子入口能省多少」。
 *
 * 三种被测目标（`--mode`）：
 *   - `src`     —— `src/index.ts`（工作区源码，与 `pnpm run build` 的输入一致）
 *   - `modules` —— `.tmp-14/libmodules/index.js`（preserveModules 产物，供 rollup 用）
 *   - `dist`    —— `.tmp-14/libdist/gpu-device-api.js`（先构到临时目录再量，绝不写仓库 `dist/`）
 *
 * 用法：
 *   node .tmp-14/measure.mjs --mode src [--key <标签>] \
 *     [--src-index <包主入口路径>] [--sub-core <路径>] [--sub-webgl2 <路径>] [--sub-webgpu <路径>] \
 *     [--out <json 路径>]
 *
 * 快照对比（before/after 同一把尺子）见 `.tmp-14/snapshot/README.md`。
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const require = createRequire(join(repoRoot, 'package.json'));

// pnpm 只把直接依赖放进 node_modules 顶层；rollup / esbuild 是 vite 的传递依赖，
// 所以先 require.resolve 定位再按真实路径 import（版本随 vite 一起锁定）。
const vitePkg = require.resolve('vite/package.json');
const viteDir = dirname(vitePkg);
const viteRequire = createRequire(vitePkg);
const rollupPath = viteRequire.resolve('rollup');
const esbuildPath = viteRequire.resolve('esbuild');
const importFromPath = (path) => import(pathToFileURL(path).href);

const args = process.argv.slice(2);
function argValue(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}
const mode = argValue('--mode', 'src');
const outPath = argValue('--out', join(here, `measure-${mode}.json`));
const key = argValue('--key', null);
const srcIndexOverride = argValue('--src-index', null);
const subCoreOverride = argValue('--sub-core', null);
const subWebgl2Override = argValue('--sub-webgl2', null);
const subWebgpuOverride = argValue('--sub-webgpu', null);

const PKG = '@dxyl/gpu-device-api';
const PKG_CORE = '@dxyl/gpu-device-api/core';
const PKG_WEBGL2 = '@dxyl/gpu-device-api/webgl2';
const PKG_WEBGPU = '@dxyl/gpu-device-api/webgpu';

/**
 * 消费方清单。
 * `imports` 只起说明作用；实际解析由 `buildAliases()` 按裸包名映射。
 */
const CONSUMERS = [
  { name: 'C1-core-webgl2', file: 'consumers/core-webgl2.ts', note: '主入口 + backend:webgl2' },
  { name: 'C2-gfx-webgl2', file: 'consumers/gfx-webgl2.ts', note: '主入口 gfx 层 + backend:webgl2' },
  { name: 'C3-all-backends', file: 'consumers/all-backends.ts', note: '主入口 + backend:auto（对照）' },
  {
    name: 'C4-core-webgl2-subentry',
    file: 'consumers/webgl2-subentry.ts',
    note: '/webgl2 子入口 + WebGL2Adapter.request（不 import BufferUsage，最省）',
    needs: ['webgl2'],
  },
  {
    name: 'C5-webgl2-subentry-lean',
    file: 'consumers/webgl2-subentry-lit.ts',
    note: '/webgl2 子入口 + WebGL2Adapter.request + BufferUsage（与 C1 语义等价）',
    needs: ['webgl2'],
  },
  { name: 'C6-core-entry-only', file: 'consumers/core-only.ts', note: '/core 子入口，只要枚举', needs: ['core'] },
];

/**
 * 标记符号：出现即证明该后端的代码进了 bundle。
 * 只用**完整标识符**，避免命中子串（例如 `WebGPUDevice` 不会命中 `WebGL2Device`）。
 */
const MARKERS = {
  webgpu: [
    'WebGPUAdapter',
    'createWebGPUAdapter',
    'WebGPUDevice',
    'WebGPURenderPassEncoder',
    'WebGPUBindGroup',
    'preferredCanvasFormat',
    'requestWebGPUAdapter',
    'FALLBACK_DEVICE_LIMITS',
  ],
  webgl2: [
    'WebGL2Adapter',
    'createWebGL2Adapter',
    'WebGL2Device',
    'WebGL2RenderPassEncoder',
    'WebGL2BindGroup',
    'WebGL2QuerySet',
    'GlStateCache',
  ],
  gfx: ['OrbitControls', 'UniformArenaPool', 'createSphere'],
};

function markersFound(text) {
  const result = {};
  for (const [group, names] of Object.entries(MARKERS)) {
    result[group] = names.filter((name) => text.includes(name));
  }
  return result;
}

function sizes(chunks) {
  const code = chunks.map((chunk) => chunk.code).join('\n');
  return {
    rawBytes: Buffer.byteLength(code, 'utf8'),
    gzipBytes: gzipSync(Buffer.from(code, 'utf8'), { level: 9 }).length,
    markers: markersFound(code),
    code,
  };
}

/**
 * 解析出「裸包名 → 目标文件」的映射。
 *
 * 三种 mode 的差别：
 * - `src`：主入口 = `src/index.ts`（或 `--src-index` 覆盖），子入口 = `src/entries/*.ts`；
 * - `modules`：主入口 / 子入口都指向一份 preserveModules 构建产物（批 14 早期的「路 B」对照）；
 * - `dist`：**真实发布产物**（路 A 的 tsc 模块树）—— 主入口 `dist/index.js`、
 *   子入口 `dist/entries/*.js`。这是「改后」最该看的数字。
 */
function buildAliases() {
  const srcEntry = srcIndexOverride ? resolve(repoRoot, srcIndexOverride) : join(repoRoot, 'src', 'index.ts');
  const aliases = { [PKG]: srcEntry };
  const targetLabel = srcIndexOverride ?? 'src/index.ts';

  if (mode === 'dist') {
    // 路 A 的产物：tsc 输出的模块树，每个源文件一个 .js；对外入口平铺在 dist/ 根下。
    const distRoot = join(repoRoot, 'dist');
    return {
      aliases: {
        [PKG]: join(distRoot, 'index.js'),
        [PKG_CORE]: join(distRoot, 'core.js'),
        [PKG_WEBGL2]: join(distRoot, 'webgl2.js'),
        [PKG_WEBGPU]: join(distRoot, 'webgpu.js'),
      },
      targetLabel: 'dist/index.js（tsc 模块树）',
      libraryFile: join(distRoot, 'index.js'),
    };
  }
  if (mode === 'modules') {
    const modulesRoot = join(here, 'libmodules');
    return {
      aliases: {
        [PKG]: join(modulesRoot, 'index.js'),
        // 由 `.tmp-14/gen-subentries.mjs` 生成：vite 把 barrel 合进了入口 chunk，
        // preserveModules 产物里没有 `core/index.js`，所以按叶子模块重拼一份。
        [PKG_CORE]: join(here, 'subentry-modules', 'gen-core.js'),
        [PKG_WEBGL2]: join(here, 'subentry-modules', 'gen-webgl2.js'),
        [PKG_WEBGPU]: join(here, 'subentry-modules', 'gen-webgpu.js'),
      },
      targetLabel: '.tmp-14/libmodules/index.js',
      libraryFile: join(modulesRoot, 'index.js'),
    };
  }
  // src
  aliases[PKG_CORE] = subCoreOverride ? resolve(repoRoot, subCoreOverride) : join(repoRoot, 'src', 'core.ts');
  aliases[PKG_WEBGL2] = subWebgl2Override ? resolve(repoRoot, subWebgl2Override) : join(repoRoot, 'src', 'webgl2.ts');
  aliases[PKG_WEBGPU] = subWebgpuOverride ? resolve(repoRoot, subWebgpuOverride) : join(repoRoot, 'src', 'webgpu.ts');
  return { aliases, targetLabel, libraryFile: resolve(repoRoot, aliases[PKG]) };
}

/** rollup 用的解析插件：把裸包名映射到目标；其余交给默认解析器。 */
function aliasPlugin(aliases) {
  return {
    name: 'tmp14-alias',
    resolveId(source) {
      if (Object.prototype.hasOwnProperty.call(aliases, source)) return aliases[source];
      return null;
    },
  };
}

/**
 * rollup 自己不懂 TypeScript。真实项目会挂 @rollup/plugin-typescript / swc / esbuild，
 * 所以这里用 esbuild 只做「去掉类型」的转换（**不打包、不摇树**），
 * 让 rollup 拿到的模块图与 esbuild / vite 两条测量一致。
 */
function typescriptStripPlugin() {
  return {
    name: 'tmp14-strip-ts',
    async transform(code, id) {
      if (!id.endsWith('.ts') && !id.endsWith('.tsx')) return null;
      const esbuild = await importFromPath(esbuildPath);
      const result = await esbuild.transform(code, { loader: 'ts', format: 'esm', target: 'es2022' });
      return { code: result.code, map: null };
    },
  };
}

async function runRollup(aliases, entry, minify) {
  const { rollup } = await importFromPath(rollupPath);
  const bundle = await rollup({
    input: entry,
    plugins: [aliasPlugin(aliases), typescriptStripPlugin()],
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      tryCatchDeoptimization: false,
    },
    onwarn: () => {},
  });
  const { output } = await bundle.generate({ format: 'es', compact: minify });
  await bundle.close();
  return output.filter((chunk) => chunk.type === 'chunk');
}

async function runEsbuild(aliases, entry, minify) {
  const esbuild = await importFromPath(esbuildPath);
  const result = await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
    minify,
    treeShaking: true,
    legalComments: 'none',
    alias: aliases,
    logLevel: 'silent',
  });
  return result.outputFiles.map((file) => ({ code: file.text }));
}

async function runVite(aliases, entry, minify) {
  const { build } = await importFromPath(join(viteDir, 'dist', 'node', 'index.js'));
  // ⚠️ vite 的 alias 是**前缀匹配**（对象形式）：`@dxyl/gpu-device-api` 会先吃掉
  // `@dxyl/gpu-device-api/webgl2`。所以必须用锚定正则，且更长的前缀在前。
  const alias = [
    { find: /^@dxyl\/gpu-device-api\/core$/, replacement: aliases[PKG_CORE] ?? PKG_CORE },
    { find: /^@dxyl\/gpu-device-api\/webgl2$/, replacement: aliases[PKG_WEBGL2] ?? PKG_WEBGL2 },
    { find: /^@dxyl\/gpu-device-api\/webgpu$/, replacement: aliases[PKG_WEBGPU] ?? PKG_WEBGPU },
    { find: /^@dxyl\/gpu-device-api$/, replacement: aliases[PKG] },
  ];
  const result = await build({
    root: here,
    configFile: false,
    logLevel: 'silent',
    resolve: { alias },
    build: {
      write: false,
      minify: minify ? 'esbuild' : false,
      target: 'es2022',
      sourcemap: false,
      lib: { entry, formats: ['es'], fileName: 'probe' },
    },
  });
  const outputs = Array.isArray(result) ? result : [result];
  return outputs.flatMap((item) => item.output ?? []).filter((chunk) => chunk.type === 'chunk');
}

async function main() {
  const { aliases, targetLabel, libraryFile } = buildAliases();
  const library = await readFile(libraryFile, 'utf8');

  const report = {
    mode,
    key,
    target: targetLabel,
    aliases,
    libraryRawBytes: Buffer.byteLength(library, 'utf8'),
    libraryGzipBytes: gzipSync(Buffer.from(library, 'utf8'), { level: 9 }).length,
    bundlers: {},
  };

  const bundlers = [
    ['rollup', runRollup],
    ['esbuild', runEsbuild],
    ['vite', runVite],
  ];

  for (const [bundlerName, run] of bundlers) {
    report.bundlers[bundlerName] = {};
    for (const consumer of CONSUMERS) {
      if (consumer.needs && consumer.needs.some((need) => !aliases[`${PKG}/${need}`])) continue;
      const entry = join(here, consumer.file);
      for (const minify of [false, true]) {
        const keyName = minify ? 'min' : 'raw';
        try {
          const chunks = await run(aliases, entry, minify);
          const measured = sizes(chunks);
          report.bundlers[bundlerName][`${consumer.name}/${keyName}`] = {
            note: consumer.note,
            rawBytes: measured.rawBytes,
            gzipBytes: measured.gzipBytes,
            markers: measured.markers,
          };
          if (!minify) report.bundlers[bundlerName][`${consumer.name}/code`] = measured.code;
        } catch (error) {
          report.bundlers[bundlerName][`${consumer.name}/${keyName}`] = {
            error: String(error && error.message ? error.message : error),
          };
        }
      }
    }
  }

  /* 汇总：树摇是否生效（C1 vs C3）与各子入口的收益。 */
  report.summary = {};
  for (const bundlerName of Object.keys(report.bundlers)) {
    const table = report.bundlers[bundlerName];
    const pick = (name) => table[`${name}/min`];
    const c1 = pick('C1-core-webgl2');
    const c3 = pick('C3-all-backends');
    if (!c1 || !c3 || c1.error || c3.error) continue;
    const summary = {
      C1_main_webgl2: { raw: c1.rawBytes, gzip: c1.gzipBytes, webgpuMarkers: c1.markers.webgpu },
      C3_main_auto: { raw: c3.rawBytes, gzip: c3.gzipBytes },
      C3minusC1_raw: c3.rawBytes - c1.rawBytes,
      C3minusC1_gzip: c3.gzipBytes - c1.gzipBytes,
      ratioC1overC3: Number((c1.rawBytes / c3.rawBytes).toFixed(4)),
      C1_webgl2Markers: c1.markers.webgl2,
    };
    for (const [label, name] of [
      ['C4_webgl2_subentry', 'C4-core-webgl2-subentry'],
      ['C5_webgl2_subentry_with_enums', 'C5-webgl2-subentry-lean'],
      ['C6_core_entry', 'C6-core-entry-only'],
    ]) {
      const item = pick(name);
      if (!item || item.error) continue;
      summary[label] = {
        raw: item.rawBytes,
        gzip: item.gzipBytes,
        savingVsC3_raw: c3.rawBytes - item.rawBytes,
        savingVsC3_gzip: c3.gzipBytes - item.gzipBytes,
        savingVsC1_raw: c1.rawBytes - item.rawBytes,
        webgpuMarkers: item.markers.webgpu,
        webgl2Markers: item.markers.webgl2,
        gfxMarkers: item.markers.gfx,
      };
    }
    report.summary[bundlerName] = summary;
  }

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(report, null, 2), 'utf8');

  /* stdout 摘要（便于人读与留档）。 */
  console.log(`mode=${mode} key=${key ?? '(none)'} target=${targetLabel}`);
  console.log(`aliases=${JSON.stringify(aliases)}`);
  console.log(`library raw=${report.libraryRawBytes} gzip=${report.libraryGzipBytes}`);
  for (const [bundlerName, table] of Object.entries(report.bundlers)) {
    console.log(`\n[${bundlerName}]`);
    for (const consumer of CONSUMERS) {
      for (const k of ['raw', 'min']) {
        const item = table[`${consumer.name}/${k}`];
        if (!item) continue;
        if (item.error) {
          console.log(`  ${consumer.name} (${k}) ERROR ${item.error}`);
          continue;
        }
        const wg = item.markers.webgpu.length ? item.markers.webgpu.join(',') : '-';
        const gl = item.markers.webgl2.length ? item.markers.webgl2.join(',') : '-';
        console.log(`  ${consumer.name} (${k}): raw=${item.rawBytes} gzip=${item.gzipBytes} webgpu=[${wg}] webgl2=[${gl}]`);
      }
    }
  }
  console.log('\n[summary, minified]');
  for (const [bundlerName, s] of Object.entries(report.summary)) {
    console.log(
      `  ${bundlerName}: C1=${s.C1_main_webgl2.raw} C3=${s.C3_main_auto.raw} C3-C1=${s.C3minusC1_raw} ratio=${s.ratioC1overC3}`,
    );
    console.log(`      C1 webgpu markers=[${s.C1_main_webgl2.webgpuMarkers.join(',')}]`);
    for (const label of ['C4_webgl2_subentry', 'C5_webgl2_subentry_with_enums', 'C6_core_entry']) {
      const v = s[label];
      if (!v) continue;
      console.log(
        `      ${label}: raw=${v.raw} gzip=${v.gzip} 省(vs C1) raw=${v.savingVsC1_raw} gzip=${v.savingVsC3_gzip} webgpu=[${v.webgpuMarkers.join(',')}]`,
      );
    }
  }
  console.log(`\nJSON -> ${outPath}`);
}

await main();
