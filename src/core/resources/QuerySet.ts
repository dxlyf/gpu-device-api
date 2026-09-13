/** GPU query set (occlusion / timestamp queries). Phase 2; typed now so pipelines can reference it. */

import type { Disposable } from '../../utils/Disposable.js';

export const QueryType = {
  Occlusion: 'occlusion',
  Timestamp: 'timestamp',
} as const;

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
