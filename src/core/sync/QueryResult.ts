/** Results of a {@link QuerySet} readback (occlusion / timestamp queries). */

import type { QueryType } from '../resources/QuerySet.js';

export interface QueryResult {
  readonly type: QueryType;
  readonly count: number;
  /** Resolves with the raw query values: sample counts or nanoseconds. */
  read(): Promise<BigUint64Array>;
}
