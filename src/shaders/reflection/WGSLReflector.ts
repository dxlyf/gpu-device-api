/**
 * WGSL 反射：从源码文本里解析出 `@group/@binding` 资源与 entry point。
 *
 * 用途有两个：
 * 1. **校验**：把管线声明的 `PipelineLayout` 与着色器里实际使用的 binding 做交叉检查，
 *    在创建管线前就报出「声明了但没用」「用了但没声明」这类问题（WebGPU 原生报错很难读）。
 * 2. **推断**：`layout: 'auto'` 时可以从源码直接推出 bind group layout，省掉手写。
 *
 * 实现是**纯文本解析**，不依赖 GPU，因此可以在 Node 里直接单测。
 * 它只覆盖资源绑定与 entry point 这两类信息，不试图做完整的 WGSL 语法分析。
 */

/** WGSL 资源变量所在的地址空间。 */
export type WgslAddressSpace = 'uniform' | 'storage' | 'handle';

/** 从 WGSL 类型推断出的资源种类。 */
export type WgslResourceKind =
  | 'uniform-buffer'
  | 'storage-buffer'
  | 'sampler'
  | 'comparison-sampler'
  | 'texture'
  | 'storage-texture';

export interface WgslBinding {
  group: number;
  binding: number;
  name: string;
  addressSpace: WgslAddressSpace;
  /** `storage` 地址空间下的访问模式。 */
  access?: 'read' | 'write' | 'read_write';
  kind: WgslResourceKind;
  /** 声明的完整类型文本，例如 `texture_2d<f32>`、`array<vec4f, 4>`。 */
  type: string;
  /** 是否为深度纹理（`texture_depth_*`）。 */
  depth: boolean;
  /** 是否为多重采样纹理。 */
  multisampled: boolean;
}

export type WgslEntryPointStage = 'vertex' | 'fragment' | 'compute';

export interface WgslEntryPoint {
  stage: WgslEntryPointStage;
  name: string;
  /** compute 入口的 workgroup_size，其它阶段为 `null`。 */
  workgroupSize: [number, number, number] | null;
}

/** 去掉行注释与块注释（WGSL 里没有字符串字面量，所以可以放心地按文本剔除）。 */
export function stripWgslComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');
}

const GROUP_BINDING = String.raw`@group\s*\(\s*(\d+)\s*\)\s*@binding\s*\(\s*(\d+)\s*\)`;
const BINDING_GROUP = String.raw`@binding\s*\(\s*(\d+)\s*\)\s*@group\s*\(\s*(\d+)\s*\)`;
const RESOURCE_VAR = String.raw`var\s*(?:<\s*([^>]*)>)?\s*([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([^;]+);`;

/**
 * 解析源码里所有带 `@group/@binding` 的资源变量。
 * 两种属性书写顺序（`@group` 在前或 `@binding` 在前）都会识别。
 */
export function reflectWgslBindings(source: string): WgslBinding[] {
  const code = stripWgslComments(source);
  const bindings: WgslBinding[] = [];

  const patterns = [
    { regex: new RegExp(`${GROUP_BINDING}\\s*${RESOURCE_VAR}`, 'g'), swapped: false },
    { regex: new RegExp(`${BINDING_GROUP}\\s*${RESOURCE_VAR}`, 'g'), swapped: true },
  ];

  for (const { regex, swapped } of patterns) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(code)) !== null) {
      const group = Number(match[swapped ? 2 : 1]);
      const binding = Number(match[swapped ? 1 : 2]);
      const addressSpaceRaw = (match[3] ?? '').trim();
      const name = match[4]!;
      const type = match[5]!.trim().replace(/\s+/g, ' ');
      // 同一个 (group, binding) 只保留第一次出现的声明。
      if (bindings.some((entry) => entry.group === group && entry.binding === binding)) continue;
      bindings.push(describeBinding(group, binding, addressSpaceRaw, name, type));
    }
  }

  return bindings.sort((a, b) => (a.group - b.group) || (a.binding - b.binding));
}

function describeBinding(
  group: number,
  binding: number,
  addressSpaceRaw: string,
  name: string,
  type: string,
): WgslBinding {
  let addressSpace: WgslAddressSpace = 'handle';
  let access: WgslBinding['access'];

  if (addressSpaceRaw.startsWith('uniform')) {
    addressSpace = 'uniform';
  } else if (addressSpaceRaw.startsWith('storage')) {
    addressSpace = 'storage';
    const parts = addressSpaceRaw.split(',').map((part) => part.trim());
    const mode = parts[1];
    if (mode === 'read') access = 'read';
    else if (mode === 'read_write') access = 'read_write';
    else if (mode === 'write') access = 'write';
  }

  const kind = classifyResource(addressSpace, type);
  return {
    group,
    binding,
    name,
    addressSpace,
    access,
    kind,
    type,
    depth: type.startsWith('texture_depth'),
    multisampled: type.startsWith('texture_multisampled'),
  };
}

function classifyResource(addressSpace: WgslAddressSpace, type: string): WgslResourceKind {
  if (addressSpace === 'uniform') return 'uniform-buffer';
  if (addressSpace === 'storage') return 'storage-buffer';
  if (type.startsWith('texture_storage_')) return 'storage-texture';
  if (type.startsWith('sampler_comparison')) return 'comparison-sampler';
  if (type.startsWith('sampler')) return 'sampler';
  if (type.startsWith('texture_')) return 'texture';
  // 未知句柄类型按纹理处理，后续校验会给出明确报错。
  return 'texture';
}

const ENTRY_POINT = /@(vertex|fragment|compute)\b([\s\S]{0,200}?)\bfn\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g;
const WORKGROUP_SIZE = /@workgroup_size\s*\(\s*(\d+)\s*(?:,\s*(\d+)\s*)?(?:,\s*(\d+)\s*)?\)/;

/** 解析源码里的所有 entry point。 */
export function reflectWgslEntryPoints(source: string): WgslEntryPoint[] {
  const code = stripWgslComments(source);
  const entryPoints: WgslEntryPoint[] = [];
  let match: RegExpExecArray | null;
  ENTRY_POINT.lastIndex = 0;
  while ((match = ENTRY_POINT.exec(code)) !== null) {
    const stage = match[1] as WgslEntryPointStage;
    const attributes = match[2] ?? '';
    const name = match[3]!;
    let workgroupSize: [number, number, number] | null = null;
    if (stage === 'compute') {
      const size = WORKGROUP_SIZE.exec(attributes);
      workgroupSize = size
        ? [Number(size[1]), Number(size[2] ?? 1), Number(size[3] ?? 1)]
        : [1, 1, 1];
    }
    entryPoints.push({ stage, name, workgroupSize });
  }
  return entryPoints;
}

/** 在源码里查找指定名字、指定阶段的 entry point。 */
export function findWgslEntryPoint(
  source: string,
  stage: WgslEntryPointStage,
  name: string,
): WgslEntryPoint | undefined {
  return reflectWgslEntryPoints(source).find((entry) => entry.stage === stage && entry.name === name);
}

/** 源码里出现的所有 binding，按 `group:binding` 归类，便于做集合比较。 */
export function wgslBindingKeys(bindings: readonly WgslBinding[]): Set<string> {
  return new Set(bindings.map((binding) => `${binding.group}:${binding.binding}`));
}
