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
  /**
   * 「有则更好」的 feature 名：只在所选后端的 adapter 支持时才申请，不支持就悄悄跳过。
   *
   * 用途是那些**允许降级**的可选能力（例如 `timestamp-query`：能拿到就顺手打开 GPU 计时，
   * 拿不到也不该让整个设备的创建失败）。与之相对，{@link DeviceDescriptor.requiredFeatures}
   * 里的名字一个都不能少，否则抛错。
   */
  optionalFeatures?: readonly string[];
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

  /**
   * 依次尝试「探测通过」的后端。
   *
   * 为什么要重试而不是一次定生死：探测阶段与真正初始化之间还有可能失败 ——
   * 最典型的是 canvas 已经被别的 context 占用（浏览器硬限制：一个 canvas 只能绑定一种 context），
   * 此时 `getContext('webgpu')` 会返回 null。既然还有其它可用后端，就不该整个启动失败。
   * 指定了具体后端、或显式 `strictBackend` 时不做回退，让错误直接暴露出来。
   */
  const allowFallback = !options.strictBackend;
  const candidates: BackendKind[] = [
    detection.backend,
    ...detection.probes.filter((probe) => probe.ok && probe.backend !== detection.backend).map((probe) => probe.backend),
  ];
  const failures: string[] = [];

  for (const backend of candidates) {
    const factory = registry.get(backend);
    if (!factory) continue;
    try {
      const adapter = await factory.createAdapter({
        canvas: options.canvas,
        contextAttributes: options.contextAttributes,
        powerPreference: options.powerPreference,
        forceFallbackAdapter: options.forceFallbackAdapter,
      });

      const device = await adapter.requestDevice({
        label: options.label,
        // 可选 feature 按 adapter 的实际能力过滤：不支持就不申请（而不是抛错）。
        requiredFeatures: mergeFeatures(options.requiredFeatures, options.optionalFeatures, adapter.features),
        requiredLimits: options.requiredLimits,
        debug: options.debug,
      });

      const context = options.canvas ? device.createCanvasContext(options.canvas) : null;

      if (backend !== detection.backend) {
        logger.warn(
          `后端 ${detection.backend} 初始化失败，已改用 ${backend}。失败原因：${failures[failures.length - 1] ?? '未知'}`,
        );
      } else if (backend === 'webgl2' && options.backend !== 'webgl2') {
        // 回退到 WebGL2 时明确提示一次，避免使用者以为自己在用 WebGPU 的某些能力。
        logger.info(`已回退到 WebGL2 后端：${detection.reason}`);
      }

      return { device, adapter, backend, probes: detection.probes, context };
    } catch (error) {
      const message = (error as Error).message;
      failures.push(`${backend} — ${message}`);
      if (!allowFallback) throw error;
      logger.warn(`后端 ${backend} 初始化失败：${message}`);
    }
  }

  throw new ValidationError(
    `[gpu-device-api] 没有可用的渲染后端。逐个初始化的结果：\n  ${failures.join('\n  ')}\n` +
      '排查建议：确认在 https 或 localhost 下运行（WebGPU 需要安全上下文）、' +
      '浏览器版本支持 WebGPU/WebGL2、显卡未被禁用。\n' +
      '另一个常见原因：这张 canvas 已经被别的代码用 getContext() 绑定成了其它类型，' +
      '一个 canvas 只能绑定一种 context —— 请为它新建一张 canvas，或换一个未被占用的 canvas。',
  );
}

/**
 * 合并「必须有」与「有则更好」的 feature，并去掉重复项与空名字。
 *
 * 可选 feature 由**所选后端 adapter 的能力集合**过滤：不支持的直接不申请，
 * 这样 `optionalFeatures: ['timestamp-query']` 在缺少该能力的机器上不会让设备创建失败。
 * 必需 feature 不做过滤：让 adapter 的校验给出「不支持 xxx」的明确错误。
 */
function mergeFeatures(
  required: readonly string[] | undefined,
  optional: readonly string[] | undefined,
  available: ReadonlySet<string>,
): readonly string[] | undefined {
  if ((!required || required.length === 0) && (!optional || optional.length === 0)) return undefined;
  const merged: string[] = [];
  for (const feature of required ?? []) {
    if (!merged.includes(feature)) merged.push(feature);
  }
  for (const feature of optional ?? []) {
    if (merged.includes(feature)) continue;
    if (!available.has(feature)) continue;
    merged.push(feature);
  }
  return merged;
}
