/**
 * `depthStencil`「不使用深度」的跨后端语义回归测试。
 *
 * 缺陷回顾（本文件钉死的就是它）：`depthStencil: { format: null }` 与**完全不声明** `depthStencil`
 * 都表示「这条管线不使用深度」。WebGL2 一直这么解释（关掉 `DEPTH_TEST`），但 WebGPU 侧曾经把这些
 * 字段回落成 `DEFAULT_DEPTH_STATE`（`depthWriteEnabled: true` + `depthCompare: 'less'`）：
 * 一条画天空的全屏三角形（`gl_Position` 深度为 0）于是把整个深度缓冲写成 0，其后所有几何体的
 * `less` 判定全部失败 —— 画面上只剩它自己，而且**没有任何报错**。
 *
 * 两个后端在用例里吃的是**同一份描述**，断言的是各自真实的落地形态：
 * - WebGPU：真正交给 `GPUDevice.createRenderPipeline()` 的 `GPUDepthStencilState`；
 * - WebGL2：`resolveRenderState()` 的结果，以及它写进 `GlStateCache` 的 GL 调用。
 *
 * 另外还钉住一条 WebGPU 特有的约束：attachment state 要求管线与 render pass 的深度附件格式一致，
 * 所以「不使用深度」不能翻译成「不挂 depthStencil」（那样在带深度附件的 pass 里会直接校验失败、
 * 整条 command buffer 作废），而要翻译成**恒通过 + 不写**。
 */

import { describe, expect, it } from 'vitest';

import { ValidationError } from '../src/core/errors/ValidationError.js';
import { GlStateCache } from '../src/webgl2/utils/glStateCache.js';
import { applyRenderState, resolveRenderState } from '../src/webgl2/pipeline/WebGL2RenderState.js';
import { readDeviceLimits } from '../src/webgpu/utils/wgpuCapabilities.js';
import { WebGPUDevice } from '../src/webgpu/WebGPUDevice.js';
import { WebGPURenderPipeline } from '../src/webgpu/pipeline/WebGPURenderPipeline.js';
import type { TextureFormat } from '../src/core/enums/TextureFormat.js';
import type { RenderPipelineDescriptor, RenderPipelineVariant } from '../src/core/pipeline/RenderPipeline.js';

/* ------------------------------------------------------------------------------------------------ */
/* WebGPU：假原生设备（记录真正下发出去的 GPURenderPipelineDescriptor）                                  */
/* ------------------------------------------------------------------------------------------------ */

interface MockGpuDevice {
  readonly device: WebGPUDevice;
  /** 每一次 `native.createRenderPipeline()` 收到的描述（按发生顺序）。 */
  readonly descriptors: GPURenderPipelineDescriptor[];
}

function createMockGpuDevice(): MockGpuDevice {
  const descriptors: GPURenderPipelineDescriptor[] = [];
  const native = {
    label: 'mock-device',
    queue: {},
    lost: new Promise(() => {}),
    onuncapturederror: null,
    limits: undefined,
    createShaderModule: ({ label, code }: { label?: string; code: string }) => ({ label, code }),
    createRenderPipeline: (descriptor: GPURenderPipelineDescriptor) => {
      descriptors.push(descriptor);
      return { label: descriptor.label, via: 'sync' };
    },
    destroy: () => {},
  } as unknown as GPUDevice;

  const device = new WebGPUDevice(native, {
    descriptor: { label: 'mock-device', defaultSampleCount: 1, requiredFeatures: [] },
    resolvedLimits: readDeviceLimits(undefined),
    adapterInfo: {
      backend: 'webgpu',
      vendor: '',
      architecture: '',
      device: '',
      description: '',
      isFallbackAdapter: false,
    },
    adapterFeatures: new Set<string>(),
  });
  return { device, descriptors };
}

const WGSL = '/* wgsl */\n@vertex fn vsMain() -> @builtin(position) vec4f { return vec4f(0.0); }';

/** 一条有 fragment stage 的管线描述；`fragment: false` 时去掉它（depth-only 管线）。 */
function pipelineDescriptor(
  device: WebGPUDevice,
  label: string,
  depthStencil: RenderPipelineDescriptor['depthStencil'],
  options: { fragment?: boolean } = {},
): RenderPipelineDescriptor {
  const module = device.createShaderModule({ label: `${label}-shader`, code: WGSL });
  return {
    label,
    layout: 'auto',
    vertex: { module, entryPoint: 'vsMain', buffers: [] },
    ...(options.fragment === false
      ? {}
      : { fragment: { module, entryPoint: 'fsMain', targets: [{ format: 'rgba8unorm' as TextureFormat }] } }),
    colorFormats: ['rgba8unorm'],
    ...(depthStencil === undefined ? {} : { depthStencil }),
  };
}

/** 组装并解析一个 variant，返回真正交给原生 `createRenderPipeline()` 的描述。 */
function buildDescriptor(
  mock: MockGpuDevice,
  descriptor: RenderPipelineDescriptor,
  depthFormat: TextureFormat | null,
): GPURenderPipelineDescriptor {
  const pipeline = new WebGPURenderPipeline(mock.device, descriptor);
  const variant: Partial<RenderPipelineVariant> = {
    colorFormats: ['rgba8unorm'],
    sampleCount: 1,
    depthFormat,
    vertexLayouts: [],
  };
  pipeline.resolve(variant);
  const last = mock.descriptors[mock.descriptors.length - 1];
  if (!last) throw new Error('mock createRenderPipeline 没有被调用');
  return last;
}

/** 画布路径的典型情形：variant 带 `depth24plus` 深度附件。 */
const CANVAS_DEPTH: TextureFormat = 'depth24plus';

describe('WebGPU：不使用深度时不写深度（format: null / 不声明）', () => {
  it('format: null → 恒通过 + 不写深度（而不是回落成写深度 + less）', () => {
    const mock = createMockGpuDevice();
    const descriptor = buildDescriptor(
      mock,
      pipelineDescriptor(mock.device, 'null-format', { format: null }),
      CANVAS_DEPTH,
    );

    expect(descriptor.depthStencil).toBeDefined();
    // 关键：附件格式必须与 pass 里的深度附件一致，否则整条 command buffer 作废。
    expect(descriptor.depthStencil?.format).toBe('depth24plus');
    expect(descriptor.depthStencil?.depthWriteEnabled).toBe(false);
    expect(descriptor.depthStencil?.depthCompare).toBe('always');
  });

  it('完全不声明 depthStencil → 与 format: null 完全一致', () => {
    const mock = createMockGpuDevice();
    const undeclared = buildDescriptor(
      mock,
      pipelineDescriptor(mock.device, 'undeclared', undefined),
      CANVAS_DEPTH,
    );
    const nullFormat = buildDescriptor(
      mock,
      pipelineDescriptor(mock.device, 'null-format', { format: null }),
      CANVAS_DEPTH,
    );

    expect(undeclared.depthStencil).toEqual(nullFormat.depthStencil);
    expect(undeclared.depthStencil?.depthWriteEnabled).toBe(false);
    expect(undeclared.depthStencil?.depthCompare).toBe('always');
  });

  it('声明了深度时缺省值才是 DEFAULT_DEPTH_STATE（写深度 + less）', () => {
    const mock = createMockGpuDevice();
    const descriptor = buildDescriptor(
      mock,
      pipelineDescriptor(mock.device, 'declared-empty', {}),
      CANVAS_DEPTH,
    );

    expect(descriptor.depthStencil?.depthWriteEnabled).toBe(true);
    expect(descriptor.depthStencil?.depthCompare).toBe('less');
  });

  it('声明了深度时显式字段原样保留', () => {
    const mock = createMockGpuDevice();
    const descriptor = buildDescriptor(
      mock,
      pipelineDescriptor(mock.device, 'declared-explicit', {
        depthWriteEnabled: false,
        depthCompare: 'less-equal',
      }),
      CANVAS_DEPTH,
    );

    expect(descriptor.depthStencil?.depthWriteEnabled).toBe(false);
    expect(descriptor.depthStencil?.depthCompare).toBe('less-equal');
  });

  it('带 stencil 的深度格式同样用「恒通过 + keep」表达「不使用」', () => {
    const mock = createMockGpuDevice();
    const descriptor = buildDescriptor(
      mock,
      pipelineDescriptor(mock.device, 'null-format-stencil', { format: null }),
      'depth24plus-stencil8',
    );

    expect(descriptor.depthStencil?.format).toBe('depth24plus-stencil8');
    expect(descriptor.depthStencil?.depthWriteEnabled).toBe(false);
    expect(descriptor.depthStencil?.depthCompare).toBe('always');
    // 模板面：compare always + 三个 keep（等价于 GL 关掉 STENCIL_TEST），写掩码 0。
    expect(descriptor.depthStencil?.stencilFront?.compare).toBe('always');
    expect(descriptor.depthStencil?.stencilFront?.passOp).toBe('keep');
    expect(descriptor.depthStencil?.stencilBack?.compare).toBe('always');
    expect(descriptor.depthStencil?.stencilWriteMask).toBe(0);
  });

  it('target 没有深度附件时干脆不挂 depthStencil（两种写法都一样）', () => {
    const mock = createMockGpuDevice();
    for (const [label, depthStencil] of [
      ['no-attachment-null', { format: null }],
      ['no-attachment-undeclared', undefined],
      ['no-attachment-declared', { depthWriteEnabled: true }],
    ] as const) {
      const descriptor = buildDescriptor(mock, pipelineDescriptor(mock.device, label, depthStencil), null);
      expect(descriptor.depthStencil, label).toBeUndefined();
    }
  });

  it('既不声明 depthStencil 又没有 fragment stage → 明确报错（照实说「什么都写不了」）', () => {
    const mock = createMockGpuDevice();
    const pipeline = new WebGPURenderPipeline(
      mock.device,
      pipelineDescriptor(mock.device, 'depth-only-missing', undefined, { fragment: false }),
    );
    expect(() => pipeline.resolve({ colorFormats: [], sampleCount: 1, depthFormat: CANVAS_DEPTH })).toThrowError(
      ValidationError,
    );
    expect(() => pipeline.resolve({ colorFormats: [], sampleCount: 1, depthFormat: CANVAS_DEPTH })).toThrowError(
      /neither a fragment stage nor a depthStencil/,
    );
  });

  it('depth-only 管线：声明 depthStencil（省略 format）仍然可以建出来', () => {
    const mock = createMockGpuDevice();
    const descriptor = buildDescriptor(
      mock,
      pipelineDescriptor(mock.device, 'depth-only', { depthWriteEnabled: true }, { fragment: false }),
      CANVAS_DEPTH,
    );
    expect(descriptor.fragment).toBeUndefined();
    expect(descriptor.depthStencil?.depthWriteEnabled).toBe(true);
    expect(descriptor.depthStencil?.depthCompare).toBe('less');
  });
});

/* ------------------------------------------------------------------------------------------------ */
/* WebGL2：resolveRenderState + 真实 GlStateCache（假 GL 记录调用）                                     */
/* ------------------------------------------------------------------------------------------------ */

const GL_ENUM = {
  DEPTH_TEST: 0x0b71,
  BLEND: 0x0be2,
  STENCIL_TEST: 0x0b90,
  CULL_FACE: 0x0b44,
  BACK: 0x0405,
  CCW: 0x0901,
  LESS: 0x0201,
} as const;

/** 只实现 `GlStateCache` 会碰到的入口，并把调用按顺序记下来。 */
function createFakeGl(): { gl: WebGL2RenderingContext; calls: string[] } {
  const calls: string[] = [];
  const gl = {
    ...GL_ENUM,
    enable: (capability: number) => calls.push(`enable:${capability}`),
    disable: (capability: number) => calls.push(`disable:${capability}`),
    depthMask: (flag: boolean) => calls.push(`depthMask:${String(flag)}`),
    depthFunc: (func: number) => calls.push(`depthFunc:${func}`),
    colorMask: (r: boolean, g: boolean, b: boolean, a: boolean) =>
      calls.push(`colorMask:${r},${g},${b},${a}`),
    blendFuncSeparate: () => calls.push('blendFuncSeparate'),
    blendEquationSeparate: () => calls.push('blendEquationSeparate'),
    stencilFunc: () => calls.push('stencilFunc'),
    cullFace: (face: number) => calls.push(`cullFace:${face}`),
    frontFace: (face: number) => calls.push(`frontFace:${face}`),
  } as unknown as WebGL2RenderingContext;
  return { gl, calls };
}

/** 把「有深度附件、无模板」的判定结果实际写进 GL 状态缓存，返回记录到的调用。 */
function glCallsFor(depthStencil: RenderPipelineDescriptor['depthStencil']): string[] {
  const { gl, calls } = createFakeGl();
  const cache = new GlStateCache(gl);
  const resolved = resolveRenderState(
    { vertex: { module: {} as never }, ...(depthStencil === undefined ? {} : { depthStencil }) },
    { depth: true, stencil: false },
  );
  applyRenderState(cache, resolved);
  return calls;
}

describe('WebGL2：不使用深度时不写深度（format: null / 不声明）', () => {
  it('format: null 与完全不声明给出完全相同的解析结果', () => {
    const base = { vertex: { module: {} as never } };
    const nullFormat = resolveRenderState({ ...base, depthStencil: { format: null } }, { depth: true, stencil: false });
    const undeclared = resolveRenderState(base, { depth: true, stencil: false });

    expect(nullFormat).toEqual(undeclared);
    expect(nullFormat.depthTest).toBe(false);
    // 不使用深度时不写深度：depthWrite 也给 false（GL 关闭 DEPTH_TEST 时本来就不更新深度缓冲，
    // 但把这里留在 true 会让解析结果看起来像「深度开着」）。
    expect(nullFormat.depthWrite).toBe(false);
  });

  it('format: null → 下发 disable(DEPTH_TEST) + depthMask(false)', () => {
    const calls = glCallsFor({ format: null });
    expect(calls).toContain(`disable:${GL_ENUM.DEPTH_TEST}`);
    expect(calls).toContain('depthMask:false');
    expect(calls).not.toContain(`enable:${GL_ENUM.DEPTH_TEST}`);
    expect(calls).not.toContain('depthMask:true');
  });

  it('完全不声明 depthStencil → 与 format: null 下发同一组 GL 调用', () => {
    expect(glCallsFor(undefined)).toEqual(glCallsFor({ format: null }));
  });

  it('声明了深度 → 下发 enable(DEPTH_TEST) + depthMask(true) + depthFunc(less)', () => {
    const calls = glCallsFor({ depthWriteEnabled: true, depthCompare: 'less' });
    expect(calls).toContain(`enable:${GL_ENUM.DEPTH_TEST}`);
    expect(calls).toContain('depthMask:true');
    expect(calls).toContain(`depthFunc:${GL_ENUM.LESS}`);
    expect(calls).not.toContain(`disable:${GL_ENUM.DEPTH_TEST}`);
  });

  it('target 没有深度附件时，即使声明了深度也不做深度测试', () => {
    const resolved = resolveRenderState(
      { vertex: { module: {} as never }, depthStencil: { depthWriteEnabled: true, depthCompare: 'less' } },
      { depth: false, stencil: false },
    );
    expect(resolved.depthTest).toBe(false);
  });

  it('深度附件带模板位时，不使用深度的管线同样不做模板测试', () => {
    const base = { vertex: { module: {} as never } };
    const target = { depth: true, stencil: true };
    expect(resolveRenderState({ ...base, depthStencil: { format: null } }, target).stencilEnabled).toBe(false);
    expect(resolveRenderState(base, target).stencilEnabled).toBe(false);
    // 声明了深度（模板位与深度位同属一个 attachment）时才会打开 STENCIL_TEST。
    expect(
      resolveRenderState({ ...base, depthStencil: { depthWriteEnabled: true, depthCompare: 'less' } }, target)
        .stencilEnabled,
    ).toBe(true);
  });
});
