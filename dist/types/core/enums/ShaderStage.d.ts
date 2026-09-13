/** {@link ShaderModule} 可编译到的 shader 阶段。位标志与 WebGPU 保持一致。 */
export declare const ShaderStage: {
    readonly None: 0;
    readonly Vertex: 1;
    readonly Fragment: 2;
    readonly Compute: 4;
};
/** {@link ShaderStage} 取值的按位或。 */
export type ShaderStage = number;
export declare const SHADER_STAGE_NAMES: Readonly<Record<number, string>>;
//# sourceMappingURL=ShaderStage.d.ts.map