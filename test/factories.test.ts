import { afterEach, describe, expect, it, vi } from 'vitest';

import { detectBackend } from '../src/factories/detectBackend.js';
import { createDefaultBackendRegistry } from '../src/factories/default-registry.js';
import { BackendRegistry } from '../src/factories/BackendRegistry.js';
import { createDeviceWithAdapter } from '../src/factories/createDevice.js';
import type { Adapter } from '../src/core/Adapter.js';

/* ------------------------------------------------------------------------------------------------ */
/* 一张会记录「被哪种 context 绑定过」的假 canvas                                                      */
/* ------------------------------------------------------------------------------------------------ */

interface FakeCanvas {
  getContext(type: string, attributes?: unknown): unknown;
  /** 已经被哪种 context 绑定；`null` 表示还没绑定。 */
  readonly boundType: string | null;
  readonly width: number;
  readonly height: number;
  readonly clientWidth: number;
  readonly clientHeight: number;
  readonly style: Record<string, string>;
  addEventListener?: () => void;
}

/**
 * 复刻浏览器最重要的那条约束：**一个 canvas 只能绑定一种 context**。
 * 绑定之后再请求另一种类型会返回 `null` —— 这正是之前那个 bug 的成因。
 */
function createFakeCanvas(supported: readonly string[]): FakeCanvas {
  let bound: string | null = null;
  return {
    width: 32,
    height: 32,
    clientWidth: 32,
    clientHeight: 32,
    style: {},
    get boundType() {
      return bound;
    },
    getContext(type: string) {
      if (bound !== null) return bound === type ? {} : null;
      if (!supported.includes(type)) return null;
      bound = type;
      return {};
    },
  };
}

/** 造一个假的 navigator.gpu：requestAdapter 成功、requestDevice 成功。 */
function stubWebGPU(options: { adapter?: boolean } = {}): void {
  const device = {
    label: 'fake-device',
    limits: {},
    features: new Set<string>(),
    lost: new Promise(() => {}),
    queue: {},
    addEventListener: () => {},
    createShaderModule: () => ({}),
    createBuffer: () => ({}),
    createTexture: () => ({}),
    createSampler: () => ({}),
    createBindGroupLayout: () => ({}),
    createBindGroup: () => ({}),
    createPipelineLayout: () => ({}),
    createRenderPipeline: () => ({}),
    createComputePipeline: () => ({}),
    createCommandEncoder: () => ({}),
    createRenderBundleEncoder: () => ({}),
    createQuerySet: () => ({}),
    destroy: () => {},
  };
  const adapter = {
    info: { vendor: 'fake', architecture: '', device: 'fake', description: '' },
    features: new Set<string>(),
    limits: {},
    requestDevice: async () => device,
  };
  vi.stubGlobal('navigator', {
    gpu: {
      requestAdapter: async () => (options.adapter === false ? null : adapter),
      getPreferredCanvasFormat: () => 'bgra8unorm',
    },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

/* ------------------------------------------------------------------------------------------------ */

describe('后端探测不能占用调用方的 canvas', () => {
  it('WebGL2 探测使用临时 canvas，真实 canvas 之后仍能拿到 webgpu context', async () => {
    stubWebGPU();
    const canvas = createFakeCanvas(['webgl2', 'webgpu']);
    // 假 document 让 getContext('webgl2') 探测建得出临时 canvas。
    vi.stubGlobal('document', { createElement: () => createFakeCanvas(['webgl2']) });

    await detectBackend({ backend: 'auto', canvas: canvas as unknown as HTMLCanvasElement });

    // 真实 canvas 必须还处于「未绑定」状态，否则选中的 WebGPU 会在 configure 时拿不到 context。
    expect(canvas.boundType).toBeNull();
  });

  it('探测会把 WebGL2 报成可用（哪怕真实 canvas 已被 webgpu 占用也无所谓）', async () => {
    stubWebGPU();
    vi.stubGlobal('document', { createElement: () => createFakeCanvas(['webgl2']) });
    const canvas = createFakeCanvas(['webgl2', 'webgpu']);
    canvas.getContext('webgpu'); // 调用方自己先占了 webgpu

    const detection = await detectBackend({ backend: 'auto', canvas: canvas as unknown as HTMLCanvasElement });
    expect(detection.backend).toBe('webgpu');
    expect(detection.probes.find((probe) => probe.backend === 'webgl2')?.ok).toBe(true);
  });

  it('WebGPU 不可用时回退 WebGL2，且此时才在真实 canvas 上建 context', async () => {
    stubWebGPU({ adapter: false });
    vi.stubGlobal('document', { createElement: () => createFakeCanvas(['webgl2']) });
    const canvas = createFakeCanvas(['webgl2', 'webgpu']);

    const detection = await detectBackend({ backend: 'auto', canvas: canvas as unknown as HTMLCanvasElement });
    expect(detection.backend).toBe('webgl2');
    expect(detection.probes.find((probe) => probe.backend === 'webgpu')?.reason).toMatch(/requestAdapter\(\) 返回 null/);
    // 探测阶段不该绑定真实 canvas。
    expect(canvas.boundType).toBeNull();
  });
});

describe('createDeviceWithAdapter 的回退与错误', () => {
  it('首选后端在初始化阶段失败时会退回下一个可用后端', async () => {
    stubWebGPU();
    vi.stubGlobal('document', { createElement: () => createFakeCanvas(['webgl2']) });
    const canvas = createFakeCanvas(['webgl2', 'webgpu']);

    // 造一个自定义注册表：webgpu 的 createAdapter 必定失败，webgl2 用真实适配路径。
    const registry = createDefaultBackendRegistry();
    const webgpuFactory = registry.get('webgpu')!;
    registry.register({
      kind: 'webgpu',
      isAvailable: (options) => webgpuFactory.isAvailable(options),
      createAdapter: async () => {
        throw new Error('[gpu-device-api] 模拟：canvas 已被别的 context 占用');
      },
    });

    // WebGL2 的假 context 需要满足 WebGL2Adapter.request 的最小查询面。
    const gl = {
      getParameter: () => 0,
      getExtension: () => null,
      getError: () => 0,
    };
    vi.stubGlobal('document', {
      createElement: () => {
        const element = createFakeCanvas(['webgl2']);
        return {
          ...element,
          getContext: (type: string) => (type === 'webgl2' ? gl : null),
        };
      },
    });
    (canvas as unknown as { getContext: (type: string) => unknown }).getContext = (type: string) =>
      type === 'webgl2' ? gl : null;

    const created = await createDeviceWithAdapter({
      canvas: canvas as unknown as HTMLCanvasElement,
      backend: 'auto',
      registry,
    });
    expect(created.backend).toBe('webgl2');
  });

  it('strictBackend 时不回退，直接抛出原始错误', async () => {
    stubWebGPU();
    const canvas = createFakeCanvas(['webgl2', 'webgpu']);
    const registry = new BackendRegistry().register({
      kind: 'webgpu',
      isAvailable: async () => ({ ok: true }),
      createAdapter: async (): Promise<Adapter> => {
        throw new Error('[gpu-device-api] 模拟失败');
      },
    });

    await expect(
      createDeviceWithAdapter({
        canvas: canvas as unknown as HTMLCanvasElement,
        backend: 'webgpu',
        strictBackend: true,
        registry,
      }),
    ).rejects.toThrowError(/模拟失败/);
  });
});
