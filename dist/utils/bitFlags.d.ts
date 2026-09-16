/** 用于数值型 bit flag 枚举（`BufferUsage`、`TextureUsage`、`ShaderStage` 等）的辅助函数。 */
export type Flags = number;
export declare function hasFlag(value: Flags, flag: Flags): boolean;
export declare function hasAnyFlag(value: Flags, flags: Flags): boolean;
export declare function hasAllFlags(value: Flags, flags: Flags): boolean;
export declare function combineFlags(...flags: Flags[]): number;
/**
 * 使用 `table` 中已命名的条目渲染位掩码（如 `{ 0x0020: 'Vertex' }`）。
 * 未知位以十六进制输出，确保数值不会被静默丢弃。
 */
export declare function formatFlags(value: Flags, table: Readonly<Record<number, string>>): string;
//# sourceMappingURL=bitFlags.d.ts.map