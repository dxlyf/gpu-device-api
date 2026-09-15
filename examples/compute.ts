/**
 * compute 示例：在 **WebGPU** 上真的跑一次 compute kernel，并把数值证据读回来；
 * 在 **WebGL2** 上把「为什么跑不了、该怎么办」明确地报出来。
 *
 * ## 为什么这个示例两个后端的行为不一样（这一点必须说清）
 *
 * WebGL2 对应的是 **GLES 3.0**，而 compute shader 是 GLES 3.1 才有的东西 ——
 * WebGL2 里**没有** compute pass、没有 SSBO、也没有 `gl_ComputeWorkGroup*` 系列常量。
 * 所以本库在 WebGL2 后端上：
 * - `device.createComputePipeline()` 立刻抛 `ValidationError`；
 * - `encoder.beginComputePass()` 立刻抛 `ValidationError`。
 *
 * 两条错误都带 `[gpu-device-api] ` 前缀并给出替代方案，**不会静默成功**（静默成功会让使用者
 * 在别处看到莫名其妙的结果）。这一页把这两条错误原文抓出来写进 `data-compute-*`，
 * 好让自动化脚本能验证「报错路径确实成立」。
 *
 * ## WebGPU 侧的数值证据
 *
 * 输入是 `src[i] = i`（0..4095 的整数），kernel 计算 `dst[i] = src[i] * src[i] + 1`。
 * 选这个式子是因为它的结果（最大 16769026 < 2^24）在 float32 里**精确可表示**，
 * 所以 GPU 结果与 CPU 期望值必须**逐元素完全相等** —— 不是「误差小于某个阈值」这种弱判据。
 *
 * 页面把下面这些写进 `<html data-*>`：
 * - `data-compute-result="pass"`：全部 4096 个值逐元素相等；
 * - `data-compute-mismatches`：不等的元素个数（必须为 0）；
 * - `data-compute-checksum` / `data-compute-expected-checksum`：GPU 读回值与 CPU 期望值的和
 *   （整数和，双精度求和精确），两者必须一致；
 * - `data-compute-sample`：首/中/末三个值的对照。
 *
 * 查询参数：`?backend=webgpu|webgl2|auto`（默认 `auto`）。
 */

import { createDeviceWithAdapter } from '../src/factories/index.js';
import { BufferUsage } from '../src/core/enums/BufferUsage.js';
import { BindingType } from '../src/core/enums/BindingType.js';
import { ShaderStage } from '../src/core/enums/ShaderStage.js';
import type { Device } from '../src/core/Device.js';

/** 元素个数（1024 的倍数，workgroup_size=64 时正好 64 个工作组）。 */
const COUNT = 4096;
/** kernel 的工作组大小，与 WGSL 里的 `@workgroup_size` 必须一致。 */
const WORKGROUP_SIZE = 64;

const KERNEL_WGSL = `
@group(0) @binding(0) var<storage, read> src: array<f32>;
@group(0) @binding(1) var<storage, read_write> dst: array<f32>;

@compute @workgroup_size(${WORKGROUP_SIZE})
fn csMain(@builtin(global_invocation_id) gid: vec3u) {
  let index = gid.x;
  if (index >= arrayLength(&src)) {
    return;
  }
  let value = src[index];
  dst[index] = value * value + 1.0;
}
`;

/** 替代方案说明：WebGL2 上没有 compute，只能拿片元着色器当 kernel 用。 */
const WEBGL2_ALTERNATIVE =
  '替代方案：在 WebGL2 上用「全屏三角形 + 浮点纹理」做 GPGPU —— ' +
  '把输入数据编码进纹理，用片元着色器当 kernel，结果渲染到另一张纹理再读回。';

function setData(key: string, value: string): void {
  document.documentElement.dataset[key] = value;
}

function writeOut(lines: readonly string[], className: string): void {
  const out = document.getElementById('out');
  if (!out) return;
  out.textContent = lines.join('\n');
  out.className = className;
}

/** CPU 期望值：`src[i] * src[i] + 1`。 */
function expectedValue(index: number): number {
  return index * index + 1;
}

async function runWebGPU(device: Device, diagnostics: string[]): Promise<void> {
  const bytes = COUNT * 4;
  const layout = device.createBindGroupLayout({
    label: 'compute-layout',
    entries: [
      {
        binding: 0,
        visibility: ShaderStage.Compute,
        type: BindingType.ReadOnlyStorage,
        name: 'src',
      },
      { binding: 1, visibility: ShaderStage.Compute, type: BindingType.Storage, name: 'dst' },
    ],
  });
  const pipelineLayout = device.createPipelineLayout({
    label: 'compute-pipeline-layout',
    bindGroupLayouts: [layout],
  });
  const module = device.createShaderModule({ label: 'kernel', code: { wgsl: KERNEL_WGSL } });
  const pipeline = device.createComputePipeline({
    label: 'scale',
    layout: pipelineLayout,
    compute: { module, entryPoint: 'csMain' },
  });

  const source = device.createBuffer({
    label: 'src',
    size: bytes,
    usage: BufferUsage.Storage | BufferUsage.CopyDst,
  });
  const destination = device.createBuffer({
    label: 'dst',
    size: bytes,
    usage: BufferUsage.Storage | BufferUsage.CopySrc,
  });
  const readback = device.createBuffer({
    label: 'readback',
    // WebGPU 规定 MapRead 只能与 CopyDst 组合（`MapRead | CopySrc` 是非法 usage）。
    size: bytes,
    usage: BufferUsage.MapRead | BufferUsage.CopyDst,
  });

  const input = new Float32Array(COUNT);
  for (let index = 0; index < COUNT; index++) input[index] = index;
  device.queue.writeBuffer(source, 0, input);

  const bindGroup = device.createBindGroup({
    label: 'compute-bind-group',
    layout,
    entries: [
      { binding: 0, resource: { buffer: source } },
      { binding: 1, resource: { buffer: destination } },
    ],
  });

  // 设备错误通道：WebGPU 的校验失败是异步上报的，不订阅就会变成「提交成功但结果全 0」。
  const reported: string[] = [];
  device.onError((error) => {
    reported.push(`${error.name}: ${error.message}`);
  });

  const started = performance.now();
  const encoder = device.createCommandEncoder({ label: 'compute' });
  const pass = encoder.beginComputePass({ label: 'kernel' });
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.dispatchWorkgroups(COUNT / WORKGROUP_SIZE);
  pass.end();
  encoder.copyBufferToBuffer(destination, 0, readback, 0, bytes);
  device.queue.submit([encoder.finish()]);

  await readback.mapAsync('read', 0, bytes);
  const output = new Float32Array(readback.getMappedRange(0, bytes).slice(0));
  readback.unmap();
  const elapsed = performance.now() - started;

  if (reported.length > 0) {
    setData('computeResult', 'fail');
    setData('computeError', reported.join(' | ').replace(/\s+/g, ' '));
    writeOut([...diagnostics, '', '设备错误通道上报了错误：', ...reported], 'fail');
    return;
  }

  let mismatches = 0;
  let firstMismatch = -1;
  let sum = 0;
  let expectedSum = 0;
  for (let index = 0; index < COUNT; index++) {
    const actual = output[index]!;
    const expected = expectedValue(index);
    sum += actual;
    expectedSum += expected;
    if (actual !== expected) {
      mismatches += 1;
      if (firstMismatch < 0) firstMismatch = index;
    }
  }

  const middle = COUNT / 2;
  const sample =
    `out[0]=${output[0]} (期望 ${expectedValue(0)})、` +
    `out[${middle}]=${output[middle]} (期望 ${expectedValue(middle)})、` +
    `out[${COUNT - 1}]=${output[COUNT - 1]} (期望 ${expectedValue(COUNT - 1)})`;

  setData('computeCount', String(COUNT));
  setData('computeMismatches', String(mismatches));
  setData('computeChecksum', String(sum));
  setData('computeExpectedChecksum', String(expectedSum));
  setData('computeSample', sample);
  setData('computeFirstMismatch', String(firstMismatch));
  setData('computeElapsedMs', elapsed.toFixed(2));

  const ok = mismatches === 0 && sum === expectedSum;
  setData('computeResult', ok ? 'pass' : 'fail');

  const lines = [
    ...diagnostics,
    `输入：src[i] = i（i = 0..${COUNT - 1}）`,
    `kernel：dst[i] = src[i] * src[i] + 1（结果在 float32 里精确可表示，所以可以逐元素严格比较）`,
    `dispatchWorkgroups(${COUNT / WORKGROUP_SIZE})，workgroup_size=${WORKGROUP_SIZE}`,
    '',
    `${ok ? 'PASS' : 'FAIL'} 逐元素比较：${COUNT} 个值，不等 ${mismatches} 个${mismatches > 0 ? `（第一个在 ${firstMismatch}）` : ''}`,
    `GPU 校验和 = ${sum}，CPU 期望和 = ${expectedSum}`,
    `抽样：${sample}`,
    `提交 + 读回耗时：${elapsed.toFixed(2)} ms`,
  ];
  if (!ok) lines.push('', '结果与 CPU 期望不一致 —— 这属于真实错误，不做任何掩盖。');
  writeOut(lines, ok ? 'pass' : 'fail');
}

/** 在 WebGL2（或任何不支持 compute 的后端）上，把两条报错路径的原文抓出来。 */
function reportUnsupportedCompute(device: Device, diagnostics: string[]): void {
  const errors: string[] = [];

  try {
    const module = device.createShaderModule({ label: 'kernel', code: { wgsl: KERNEL_WGSL } });
    device.createComputePipeline({ label: 'scale', compute: { module, entryPoint: 'csMain' } });
    errors.push('createComputePipeline() 没有抛错 —— 这是错的，WebGL2 上必须明确失败。');
  } catch (error) {
    errors.push(`createComputePipeline() → ${(error as Error).name}: ${(error as Error).message}`);
  }

  try {
    const encoder = device.createCommandEncoder({ label: 'compute' });
    encoder.beginComputePass({ label: 'kernel' });
    errors.push('beginComputePass() 没有抛错 —— 这是错的，WebGL2 上必须明确失败。');
  } catch (error) {
    errors.push(`beginComputePass() → ${(error as Error).name}: ${(error as Error).message}`);
  }

  const prefixed = errors.every((line) => line.includes('[gpu-device-api] '));
  setData('computeResult', prefixed ? 'unsupported' : 'fail');
  setData('computeError', errors.join(' | ').replace(/\s+/g, ' '));
  setData('computeAlternative', 'fragment-shader-gpgpu');

  writeOut(
    [
      ...diagnostics,
      '',
      `backend=${device.backend} 上没有 compute shader（它对应 GLES 3.0，compute 需要 GLES 3.1）。`,
      '本库不会假装成功，两条入口都明确报错：',
      ...errors.map((line) => `  · ${line}`),
      '',
      WEBGL2_ALTERNATIVE,
    ],
    prefixed ? 'warn' : 'fail',
  );
}

async function run(): Promise<void> {
  const params = new URLSearchParams(location.search);
  const requested = params.get('backend') ?? 'auto';

  setData('computeResult', 'running');
  const created = await createDeviceWithAdapter({
    backend: requested === 'webgl2' || requested === 'webgpu' ? requested : 'auto',
    strictBackend: requested !== 'auto',
    label: 'compute-demo',
  });
  const device = created.device;
  setData('computeBackend', device.backend);

  const diagnostics = [
    `backend=${device.backend}（数据页要求 ${requested}）`,
    `features：${device.features.names.join(', ') || '(无)'}`,
  ];

  if (device.backend === 'webgpu') {
    await runWebGPU(device, diagnostics);
  } else {
    reportUnsupportedCompute(device, diagnostics);
  }
  device.dispose();
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  setData('computeResult', 'fail');
  setData('computeError', message.replace(/\s+/g, ' '));
  writeOut([`非预期异常：`, message], 'fail');
});
