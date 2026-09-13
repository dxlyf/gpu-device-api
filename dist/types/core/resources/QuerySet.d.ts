/** GPU query set（occlusion / timestamp 查询）。属于第二阶段；现在先给出类型，便于 pipeline 引用。 */
import type { Disposable } from '../../utils/Disposable.js';
export declare const QueryType: {
    readonly Occlusion: "occlusion";
    readonly Timestamp: "timestamp";
};
export type QueryType = (typeof QueryType)[keyof typeof QueryType];
export interface QuerySetDescriptor {
    label?: string;
    type: QueryType;
    count: number;
}
export interface QuerySet extends Disposable {
    readonly label: string;
    readonly type: QueryType;
    readonly count: number;
    readonly native: unknown;
    destroy(): void;
}
//# sourceMappingURL=QuerySet.d.ts.map