/**
 * 批 14 第一步测量：一个「只用 WebGL2」的最小消费方，是否已经把整个 WebGPU 后端打进自己的 bundle？
 *
 * 判定方法（可判定，不靠体积猜）：
 *   1. 三个最小消费方（见 `consumers/`）只差「用哪个后端」这一个维度：
 *      C1 与 C3 是逐行相同、只差 `backend: 'webgl2'` / `'auto'` 这一处字符串的对照组；
 *   2. 用三种真实打包器（rollup / esbuild / vite）各自打包同构的模块图；
 *   3. 在产物里搜**只可能由 WebGPU 后端产生**的完整符号（`WebGPUAdapter`、`WebGPUDevice`、
 *      `WebGPURenderPassEncoder`、`preferredCanvasFormat`、`requestWebGPUAdapter` 等），
 *      并用 WebGL2 的对照符号证明「搜索本身是有效的」（否则就是假阴性）；
 *   4. 给出**原始字节 / gzip 字节**。
 *   5. C4 是**反事实**探针（假想 `/webgl2` 子入口），用来给「切子入口能省多少」定上界。
 *
 * 三种被测目标（`--mode`）：
 *   - `src`     —— `src/index.ts`（工作区源码，与 `pnpm run build` 的输入一致）
 *   - `modules` —— `.tmp-14/libmodules/index.js`（preserveModules 产物，供 rollup 用；见 README）
 *   - `dist`    —— `.tmp-14/libdist/gpu-device-api.js`（先构到临时目录再量，绝不写仓库 `dist/`）
 *
 * 用法： node .tmp-14/measure.mjs [--mode src|modules|dist] [--out <json 路径>]
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

const PKG = '@dxyl/gpu-device-api';
const PKG_SUB = '@dxyl/gpu-device-api/webgl2';

/** 消费方清单。C1 / C3 是核心对照组；C4 是反事实探针。 */
const CONSUMERS = [
  { name: 'C1-core-webgl2', file: 'consumers/core-webgl2.ts', note: 'core 层 + backend:webgl2' },
  { name: 'C2-gfx-webgl2', file: 'consumers/gfx-webgl2.ts', note: 'gfx 层 + backend:webgl2' },
  { name: 'C3-all-backends', file: 'consumers/all-backends.ts', note: 'core 层 + backend:auto（对照）' },
  {
    name: 'C4-fake-webgl2-subentry',
    file: 'consumers/webgl2-subentry.ts',
    note: '反事实：假如存在 /webgl2 子入口（不触及 WebGPU）',
    subentryOnly: true,
  },
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
    'WGPU_DEVICE_LOST',
    'wgpuFormatMap',
    'preferredCanvasFormat',
    'requestWebGPUAdapter',
  ],
  webgl2: [
    'WebGL2Adapter',
    'createWebGL2Adapter',
    'WebGL2Device',
    'WebGL2RenderPassEncoder',
    'glStateCache',
    'glEnumMap',
  ],
  gfx: ['OrbitControls', 'UniformArenaPool'],
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

/** rollup / vite / esbuild 共用的解析插件：把裸包名映射到本批要测的目标。 */
function aliasPlugin(target, subTarget) {
  return {
    name: 'tmp14-alias',
    resolveId(source) {
      if (source === PKG_SUB) return subTarget ?? null;
      if (source === PKG) return target;
      // 其余（相对 / 绝对路径）交给默认解析器
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

async function runRollup(target, subTarget, entry, minify) {
  const { rollup } = await importFromPath(rollupPath);
  const bundle = await rollup({
    input: entry,
    plugins: [aliasPlugin(target, subTarget), typescriptStripPlugin()],
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

async function runEsbuild(target, subTarget, entry, minify) {
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
    alias: { [PKG]: target, ...(subTarget ? { [PKG_SUB]: subTarget } : {}) },
    logLevel: 'silent',
  });
  return result.outputFiles.map((file) => ({ code: file.text }));
}

async function runVite(target, subTarget, entry, minify) {
  const { build } = await importFromPath(join(viteDir, 'dist', 'node', 'index.js'));
  // vite 的 alias 是「前缀匹配」：字符串形式下 `@dxyl/gpu-device-api` 会先把
  // `@dxyl/gpu-device-api/webgl2` 吃掉，所以这里必须用锚定的正则。
  const alias = [
    { find: /^@dxyl\/gpu-device-api\/webgl2$/, replacement: subTarget ?? PKG_SUB },
    { find: /^@dxyl\/gpu-device-api$/, replacement: target },
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
  const srcEntry = join(repoRoot, 'src', 'index.ts');
  const distEntry = join(here, 'libdist', 'gpu-device-api.js');
  const modulesEntry = join(here, 'libmodules', 'index.js');
  let target;
  let targetLabel;
  let libraryFile;
  let subTarget = join(here, 'subentry', 'webgl2.ts');
  if (mode === 'dist') {
    target = distEntry;
    targetLabel = '.tmp-14/libdist/gpu-device-api.js';
    libraryFile = distEntry;
    subTarget = null; // 单文件产物没有子树可导入，反事实探针在 dist 模式下不成立
  } else if (mode === 'modules') {
    target = modulesEntry;
    targetLabel = '.tmp-14/libmodules/index.js';
    libraryFile = modulesEntry;
    subTarget = join(here, 'subentry-modules', 'webgl2.ts');
  } else {
    target = srcEntry;
    targetLabel = 'src/index.ts';
    libraryFile = srcEntry;
  }
  const library = await readFile(libraryFile, 'utf8');

  const report = {
    mode,
    target: targetLabel,
    subentryTarget: subTarget,
    libraryRawBytes: Buffer.byteLength(library, 'utf8'),
    libraryGzipBytes: gzipSync(Buffer.from(library, 'utf8'), { level: 9 }).length,
    bundlers: {},
    consumers: {},
  };

  const bundlers = [
    ['rollup', runRollup],
    ['esbuild', runEsbuild],
    ['vite', runVite],
  ];

  for (const [bundlerName, run] of bundlers) {
    report.bundlers[bundlerName] = {};
    for (const consumer of CONSUMERS) {
      if (consumer.subentryOnly && !subTarget) continue;
      const entry = join(here, consumer.file);
      for (const minify of [false, true]) {
        const key = minify ? 'min' : 'raw';
        try {
          const chunks = await run(target, subTarget, entry, minify);
          const measured = sizes(chunks);
          report.bundlers[bundlerName][`${consumer.name}/${key}`] = {
            note: consumer.note,
            rawBytes: measured.rawBytes,
            gzipBytes: measured.gzipBytes,
            markers: measured.markers,
          };
          if (!minify) {
            report.bundlers[bundlerName][`${consumer.name}/code`] = measured.code;
          }
        } catch (error) {
          report.bundlers[bundlerName][`${consumer.name}/${key}`] = {
            error: String(error && error.message ? error.message : error),
          };
        }
      }
    }
  }

  /* 汇总：C1 vs C3（树摇是否生效）与 C1 vs C4（切子入口的收益上界）。 */
  report.summary = {};
  for (const bundlerName of Object.keys(report.bundlers)) {
    const table = report.bundlers[bundlerName];
    const pick = (name) => table[`${name}/min`];
    const c1 = pick('C1-core-webgl2');
    const c3 = pick('C3-all-backends');
    const c4 = pick('C4-fake-webgl2-subentry');
    if (!c1 || !c3 || c1.error || c3.error) continue;
    const entry = {
      c1MinRaw: c1.rawBytes,
      c3MinRaw: c3.rawBytes,
      deltaRawC3minusC1: c3.rawBytes - c1.rawBytes,
      ratioC1overC3: Number((c1.rawBytes / c3.rawBytes).toFixed(4)),
      c1MinGzip: c1.gzipBytes,
      c3MinGzip: c3.gzipBytes,
      deltaGzipC3minusC1: c3.gzipBytes - c1.gzipBytes,
      c1WebgpuMarkers: c1.markers.webgpu,
      c1Webgl2Markers: c1.markers.webgl2,
    };
    if (c4 && !c4.error) {
      entry.c4MinRaw = c4.rawBytes;
      entry.c4MinGzip = c4.gzipBytes;
      entry.subentrySavingRaw = c3.rawBytes - c4.rawBytes;
      entry.subentrySavingGzip = c3.gzipBytes - c4.gzipBytes;
      entry.c4WebgpuMarkers = c4.markers.webgpu;
    }
    report.summary[bundlerName] = entry;
  }

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(report, null, 2), 'utf8');

  /* stdout 摘要（便于人读与留档）。 */
  console.log(`mode=${mode} target=${targetLabel} subentry=${subTarget ?? '(none)'}`);
  console.log(`library raw=${report.libraryRawBytes} gzip=${report.libraryGzipBytes}`);
  for (const [bundlerName, table] of Object.entries(report.bundlers)) {
    console.log(`\n[${bundlerName}]`);
    for (const consumer of CONSUMERS) {
      for (const key of ['raw', 'min']) {
        const item = table[`${consumer.name}/${key}`];
        if (!item) continue;
        if (item.error) {
          console.log(`  ${consumer.name} (${key}) ERROR ${item.error}`);
          continue;
        }
        const wg = item.markers.webgpu.length ? item.markers.webgpu.join(',') : '-';
        const gl = item.markers.webgl2.length ? item.markers.webgl2.join(',') : '-';
        console.log(
          `  ${consumer.name} (${key}): raw=${item.rawBytes} gzip=${item.gzipBytes}\n      webgpu=[${wg}]\n      webgl2=[${gl}]`,
        );
      }
    }
  }
  console.log('\n[summary, minified]');
  for (const [bundlerName, s] of Object.entries(report.summary)) {
    console.log(
      `  ${bundlerName}: C1(webgl2)=${s.c1MinRaw} C3(auto)=${s.c3MinRaw} delta=${s.deltaRawC3minusC1} ratio=${s.ratioC1overC3} gzip ${s.c1MinGzip}/${s.c3MinGzip}`,
    );
    console.log(`      C1 webgpu markers=[${s.c1WebgpuMarkers.join(',')}]  webgl2=[${s.c1Webgl2Markers.join(',')}]`);
    if (s.c4MinRaw !== undefined) {
      console.log(
        `      C4(fake /webgl2 subentry)=${s.c4MinRaw} gzip=${s.c4MinGzip} -> 相对 C3 省 raw=${s.subentrySavingRaw} gzip=${s.subentrySavingGzip}; C4 webgpu markers=[${s.c4WebgpuMarkers.join(',')}]`,
      );
    }
  }
  console.log(`\nJSON -> ${outPath}`);
}

await main();
