/**
 * 批 14：子入口（`package.json` 的 `exports` 新增项）的契约测试。
 *
 * 这一批**只动构建与入口**，不改渲染行为，所以测试不碰 GPU：
 * 它守的是「入口拆分这件事本身的形状」—— 一旦有人把 `src/entries/*.ts` 的
 * 导出面结构调整（例如不小心把 `src/factories` 引进 `/webgl2`），
 * 「只用 WebGL2 的使用方不必背上 WebGPU」这个收益就会**静默消失**
 * （体积不会报错，只会悄悄变大）。所以这里用三条断言把它钉住：
 *
 * 1. **公开面**：三个子入口与主入口各自导出的关键符号在位；
 * 2. **切面隔离**：`/core` 与 `/webgl2` 入口**不得**导出任何 WebGPU 后端的符号
 *    （`WebGPUAdapter` / `WebGPUDevice` / `wgpuFormatMap` 之类）；
 * 3. **反向也成立**：`/webgpu` 入口不得导出 WebGL2 后端的符号。
 *
 * 第 2、3 条是「可判定」的：它们不需要打包器，也不需要浏览器 —— 直接检查入口模块的
 * 命名空间即可（`import * as ns` 会让 Vite 把整棵模块图求值，所以这也是运行时真实形状）。
 *
 * 体积层面的证据（打包后字节数）在 `.tmp-14/RESULT.md`；这里守的是那条证据的**前提**。
 */

import { describe, expect, it } from 'vitest';

import * as mainEntry from '../src/index.js';
import * as coreEntry from '../src/core.js';
import * as webgl2Entry from '../src/webgl2.js';
import * as webgpuEntry from '../src/webgpu.js';

/** WebGPU 后端专有的导出名（出现在 `/core` 或 `/webgl2` 里就说明切面漏了）。 */
const WEBGPU_ONLY = [
  'WebGPUAdapter',
  'WebGPUDevice',
  'WebGPUCanvasContext',
  'WebGPURenderPipeline',
  'WebGPURenderPassEncoder',
  'WebGPUPipelineCache',
  'WebGPUBindGroup',
  'requestWebGPUAdapter',
  'FALLBACK_DEVICE_LIMITS',
];

/** WebGL2 后端专有的导出名（出现在 `/webgpu` 里就说明切面漏了）。 */
const WEBGL2_ONLY = [
  'WebGL2Adapter',
  'WebGL2Device',
  'WebGL2CanvasContext',
  'WebGL2RenderPipeline',
  'WebGL2RenderPassEncoder',
  'WebGL2BindGroup',
  'GL_TEXTURE_FORMATS',
  'GlStateCache',
];

/**
 * core / utils 的公共**运行时**导出名：三个后端子入口都应该带上。
 * 注意只放运行时值（枚举对象、类、函数）—— `TextureFormat` 这类是纯类型，
 * 编译后不存在，`import * as ns` 上自然看不到它（类型面的检查由 `tsc` 负责）。
 */
const CORE_PUBLIC = ['BufferUsage', 'CompareFunction', 'ValidationError'];

describe('批 14：构建入口拆分', () => {
  it('主入口仍然是全量公开面（core + utils + shaders + factories + gfx）', () => {
    // 每一层抽一个代表，确认主入口没有被「顺手收窄」。
    for (const name of ['BufferUsage', 'ValidationError', 'BackendRegistry', 'detectBackend']) {
      expect(mainEntry, `主入口应导出 ${name}`).toHaveProperty(name);
    }
    for (const name of ['createDevice', 'createDeviceWithAdapter']) {
      expect(mainEntry, `主入口应导出 ${name}`).toHaveProperty(name);
    }
    for (const name of ['Renderer', 'PerspectiveCamera', 'OrbitControls', 'shapes', 'materials']) {
      expect(mainEntry, `主入口应导出 gfx 的 ${name}`).toHaveProperty(name);
    }
    // 两个后端的 Adapter 在主入口里都可以从各自模块子树拿到（主入口导出 core/utils/shaders/factories/gfx，
    // 后端类本身不直接导出，这正是「主入口靠 createDevice 选后端」的设计）。
    expect(mainEntry.createDevice).toBeTypeOf('function');
  });

  describe('/core 子入口', () => {
    it('导出 core 与 utils，但不含任何后端', () => {
      for (const name of CORE_PUBLIC) {
        expect(coreEntry, `/core 应导出 ${name}`).toHaveProperty(name);
      }
      for (const name of WEBGPU_ONLY) {
        expect(coreEntry, `/core 不应导出 WebGPU 的 ${name}`).not.toHaveProperty(name);
      }
      for (const name of WEBGL2_ONLY) {
        expect(coreEntry, `/core 不应导出 WebGL2 的 ${name}`).not.toHaveProperty(name);
      }
      // 工厂层（会同时拉进两个后端）也不该在 /core 里
      expect(coreEntry).not.toHaveProperty('createDevice');
      expect(coreEntry).not.toHaveProperty('createDefaultBackendRegistry');
    });
  });

  describe('/webgl2 子入口', () => {
    it('导出 core + utils + WebGL2 后端，且不含任何 WebGPU 符号', () => {
      for (const name of CORE_PUBLIC) {
        expect(webgl2Entry, `/webgl2 应导出 ${name}`).toHaveProperty(name);
      }
      for (const name of ['WebGL2Adapter', 'WebGL2Device', 'WebGL2RenderPipeline', 'GL_TEXTURE_FORMATS']) {
        expect(webgl2Entry, `/webgl2 应导出 ${name}`).toHaveProperty(name);
      }
      for (const name of WEBGPU_ONLY) {
        expect(webgl2Entry, `/webgl2 不应导出 WebGPU 的 ${name}`).not.toHaveProperty(name);
      }
      // 关键：不能把 factories 引进来 —— 那是「两个后端都会进 bundle」的唯一入口。
      expect(webgl2Entry).not.toHaveProperty('createDevice');
      expect(webgl2Entry).not.toHaveProperty('createDefaultBackendRegistry');
    });

    it('WebGL2Adapter.request 是可用函数（不使用主入口的 createDevice 也能建设备）', () => {
      expect(webgl2Entry.WebGL2Adapter).toBeTypeOf('function');
      expect(webgl2Entry.WebGL2Adapter.request).toBeTypeOf('function');
    });
  });

  describe('/webgpu 子入口', () => {
    it('导出 core + utils + WebGPU 后端，且不含任何 WebGL2 符号', () => {
      for (const name of CORE_PUBLIC) {
        expect(webgpuEntry, `/webgpu 应导出 ${name}`).toHaveProperty(name);
      }
      for (const name of ['WebGPUAdapter', 'WebGPUDevice', 'WebGPURenderPipeline', 'requestWebGPUAdapter']) {
        expect(webgpuEntry, `/webgpu 应导出 ${name}`).toHaveProperty(name);
      }
      for (const name of WEBGL2_ONLY) {
        expect(webgpuEntry, `/webgpu 不应导出 WebGL2 的 ${name}`).not.toHaveProperty(name);
      }
      expect(webgpuEntry).not.toHaveProperty('createDevice');
    });
  });

  it('三个子入口共享同一份 core 导出（同名导出是同一个绑定）', () => {
    // 这不是「体积」断言，而是「没有为子入口复制一套 core」的证明：
    // 子入口只是 re-export，`src/core` 是同一份模块实例。
    expect(coreEntry.BufferUsage).toBe(webgl2Entry.BufferUsage);
    expect(coreEntry.BufferUsage).toBe(webgpuEntry.BufferUsage);
    expect(coreEntry.BufferUsage).toBe(mainEntry.BufferUsage);
    expect(webgl2Entry.ValidationError).toBe(mainEntry.ValidationError);
  });
});
