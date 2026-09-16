/**
 * 反事实探针用的「假想子入口」（modules 模式）：只重新导出 core / utils / webgl2 三个模块子树。
 * 指向 `.tmp-14/libmodules/`（preserveModules 产物），供 rollup 那条测量使用。
 */

export * from '../../libmodules/core/index.js';
export * from '../../libmodules/utils/index.js';
export * from '../../libmodules/webgl2/index.js';
