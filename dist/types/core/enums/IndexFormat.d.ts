/** index buffer 的元素类型。 */
export declare const IndexFormat: {
    readonly Uint16: "uint16";
    readonly Uint32: "uint32";
};
export type IndexFormat = (typeof IndexFormat)[keyof typeof IndexFormat];
export declare function indexFormatByteSize(format: IndexFormat): number;
/** 选择能够寻址 `vertexCount` 个 vertex 的最小 index 格式。 */
export declare function smallestIndexFormat(vertexCount: number): IndexFormat;
//# sourceMappingURL=IndexFormat.d.ts.map