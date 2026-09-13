/**
 * `createDevice`：统一入口。自动探测后端、创建 adapter 与 device，
 * 并在需要 canvas 时把 canvas context 一并配置好。
 *
 * ```ts
 * const { device, context } = await createRenderer({ canvas }); // gfx 层的写法
 * const device = await createDevice({ backend: 'auto', canvas }); // core 层的写法
 * ```
 */

import { ValidationError } from '../core/errors/ValidationError.js';
import { createLogger, type Logger } from '../utils/logger.js';
import { detectBackend, type BackendProbeResult } from './detectBackend.js';
import { createDefaultBackendRegistry } from './default-registry.js';
import type { BackendCreateOptions, BackendRegistry } from './BackendRegistry.js';
import type { Adapter, BackendKind } from '../core/Adapter.js';
import type { Device, DeviceDescriptor } from '../core/Device.js';
import type { CanvasContext } from '../core/CanvasContext.js';

export interface CreateDeviceOptions extends DeviceDescriptor, BackendCreateOptions {
  /** `'auto'`（默认）优先 WebGPU，失败回退 WebGL2；也可以强制指定。 */
  backend?: BackendKind | 'auto';
  /** 尝试顺序，仅在 `backend: 'auto'` 时生效。 */
  order?: readonly BackendKind[];
  registry?: BackendRegistry;
  logger?: Logger;
  /**
   * 为 true 时禁止自动回退：指定的后端不可用就直接抛错。
   * 调试 WebGPU 专用功能（compute、storage buffer）时很有用 —— 免得悄悄跑在 WebGL2 上。
   */
  strictBackend?: boolean;
}

export interface CreatedDevice {
  device: Device;
  adapter: Adapter;
  /** 实际选中的后端。 */
  backend: BackendKind;
  /** 各候选后端的探测结果（用于诊断「为什么没跑在 WebGPU 上」）。 */
  probes: BackendProbeResult[];
  /** 传入 canvas 时附带已配置好的 canvas context。 */
  context: CanvasContext | null;
}

/**
 * 创建 device。
 *
 * @throws ValidationError 当所有候选后端都不可用，或 `strictBackend` 下所选后端不可用。
 */
export async function createDevice(options: CreateDeviceOptions = {}): Promise<Device> {
  const created = await createDeviceWithAdapter(options);
  return created.device;
}

/** 与 {@link createDevice} 相同，但把 adapter / 探测结果 / canvas context 一并返回。 */
export async function createDeviceWithAdapter(options: CreateDeviceOptions = {}): Promise<CreatedDevice> {
  const logger = options.logger ?? createLogger('gpu-device-api');
  const registry = options.registry ?? createDefaultBackendRegistry();

  const detection = await detectBackend({
    backend: options.backend ?? 'auto',
    order: options.order,
    canvas: options.canvas,
    contextAttributes: options.contextAttributes,
    powerPreference: options.powerPreference,
    forceFallbackAdapter: options.forceFallbackAdapter,
    registry,
  });

  if (detection.backend === null) {
    throw new ValidationError(
      `[gpu-device-api] 无法创建渲染设备：${detection.reason}\n` +
        '排查建议：确认在 https 或 localhost 下运行（WebGPU 需要安全上下文）、' +
        '浏览器版本支持 WebGPU/WebGL2、显卡未被禁用。',
    );
  }

  if (options.strictBackend && options.backend && options.backend !== 'auto' && options.backend !== detection.backend) {
    throw new ValidationError(
      `[gpu-device-api] 要求使用 ${options.backend} 后端，但它不可用：${detection.reason}`,
    );
  }

  const factory = registry.get(detection.backend);
  if (!factory) {
    throw new ValidationError(`[gpu-device-api] 后端 ${detection.backend} 未注册。`);
  }

  const adapter = await factory.createAdapter({
    canvas: options.canvas,
    contextAttributes: options.contextAttributes,
    powerPreference: options.powerPreference,
    forceFallbackAdapter: options.forceFallbackAdapter,
  });

  const device = await adapter.requestDevice({
    label: options.label,
    requiredFeatures: options.requiredFeatures,
    requiredLimits: options.requiredLimits,
    debug: options.debug,
  });

  // 回退到 WebGL2 时明确提示一次，避免使用者以为自己在用 WebGPU 的某些能力。
  if (detection.backend === 'webgl2' && options.backend !== 'webgl2') {
    logger.info(`已回退到 WebGL2 后端：${detection.reason}`);
  }

  const context = options.canvas ? device.createCanvasContext(options.canvas) : null;

  return { device, adapter, backend: detection.backend, probes: detection.probes, context };
}
