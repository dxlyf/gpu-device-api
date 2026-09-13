/** 混合方程中的源/目标因子。 */
export declare const BlendFactor: {
    readonly Zero: "zero";
    readonly One: "one";
    readonly Src: "src";
    readonly OneMinusSrc: "one-minus-src";
    readonly SrcAlpha: "src-alpha";
    readonly OneMinusSrcAlpha: "one-minus-src-alpha";
    readonly Dst: "dst";
    readonly OneMinusDst: "one-minus-dst";
    readonly DstAlpha: "dst-alpha";
    readonly OneMinusDstAlpha: "one-minus-dst-alpha";
    readonly SrcAlphaSaturated: "src-alpha-saturated";
    readonly Constant: "constant";
    readonly OneMinusConstant: "one-minus-constant";
};
export type BlendFactor = (typeof BlendFactor)[keyof typeof BlendFactor];
//# sourceMappingURL=BlendFactor.d.ts.map