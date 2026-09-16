/**
 * 反事实探针用的「假想子入口」：只把 core 与 WebGL2 后端重新导出。
 * 只有 `.tmp-14/consumers/webgl2-subentry.ts` 会 import 它；不改仓库里的任何公开面。
 */

export * from '../../src/core/index.js';
export * from '../../src/utils/index.js';
export * from '../../src/webgl2/index.js';
