/** 用于数值型 bit flag 枚举（`BufferUsage`、`TextureUsage`、`ShaderStage` 等）的辅助函数。 */

export type Flags = number;

export function hasFlag(value: Flags, flag: Flags): boolean {
  return (value & flag) === flag;
}

export function hasAnyFlag(value: Flags, flags: Flags): boolean {
  return (value & flags) !== 0;
}

export function hasAllFlags(value: Flags, flags: Flags): boolean {
  return (value & flags) === flags;
}

export function combineFlags(...flags: Flags[]): number {
  let result = 0;
  for (const flag of flags) result |= flag;
  return result;
}

/**
 * 使用 `table` 中已命名的条目渲染位掩码（如 `{ 0x0020: 'Vertex' }`）。
 * 未知位以十六进制输出，确保数值不会被静默丢弃。
 */
export function formatFlags(value: Flags, table: Readonly<Record<number, string>>): string {
  if (value === 0) return 'None';
  const names: string[] = [];
  let covered = 0;
  for (const [bit, name] of Object.entries(table)) {
    const numeric = Number(bit);
    if (numeric !== 0 && (value & numeric) === numeric) {
      names.push(name);
      covered |= numeric;
    }
  }
  const rest = value & ~covered;
  if (rest) names.push(`0x${rest.toString(16)}`);
  return names.join(' | ');
}
