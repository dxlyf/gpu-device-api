/** vertex 如何组装为图元。 */
export declare const PrimitiveTopology: {
    readonly PointList: "point-list";
    readonly LineList: "line-list";
    readonly LineStrip: "line-strip";
    readonly TriangleList: "triangle-list";
    readonly TriangleStrip: "triangle-strip";
};
export type PrimitiveTopology = (typeof PrimitiveTopology)[keyof typeof PrimitiveTopology];
/** 当该拓扑组装三角形时返回 true。 */
export declare function isTriangleTopology(topology: PrimitiveTopology): boolean;
/** 给定拓扑下，由 `count` 个 vertex/index 生成的图元数量。 */
export declare function primitiveCount(topology: PrimitiveTopology, count: number): number;
//# sourceMappingURL=PrimitiveTopology.d.ts.map