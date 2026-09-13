/**
 * depth/stencil 比较函数。
 * `less` 是常用的 depth 测试；`less-equal` 常用于 shadow map。
 */
export declare const CompareFunction: {
    readonly Never: "never";
    readonly Less: "less";
    readonly Equal: "equal";
    readonly LessEqual: "less-equal";
    readonly Greater: "greater";
    readonly NotEqual: "not-equal";
    readonly GreaterEqual: "greater-equal";
    readonly Always: "always";
};
export type CompareFunction = (typeof CompareFunction)[keyof typeof CompareFunction];
//# sourceMappingURL=CompareFunction.d.ts.map