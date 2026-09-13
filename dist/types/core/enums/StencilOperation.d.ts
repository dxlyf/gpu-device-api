/** stencil 测试通过/失败时应用的 stencil 操作。 */
export declare const StencilOperation: {
    readonly Keep: "keep";
    readonly Zero: "zero";
    readonly Replace: "replace";
    readonly Invert: "invert";
    readonly IncrementClamp: "increment-clamp";
    readonly DecrementClamp: "decrement-clamp";
    readonly IncrementWrap: "increment-wrap";
    readonly DecrementWrap: "decrement-wrap";
};
export type StencilOperation = (typeof StencilOperation)[keyof typeof StencilOperation];
//# sourceMappingURL=StencilOperation.d.ts.map