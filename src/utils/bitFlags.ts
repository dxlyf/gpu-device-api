/** Helpers for the numeric bit-flag enums (`BufferUsage`, `TextureUsage`, `ShaderStage`, ...). */

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
 * Renders a bit mask using the named entries of `table` (`{ 0x0020: 'Vertex' }`).
 * Unknown bits are emitted as hex so values are never silently lost.
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
