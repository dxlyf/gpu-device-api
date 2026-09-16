/**
 * 【已废弃 —— 批 14 改为「路 A：tsc 输出模块树」后本文件不再被使用】
 *
 * 它原本是「路 B」（保留 vite 打包，改成多入口 `lib.entry`）那条实验路径下，
 * `--mode modules` 测量用的假想子入口之一：指向 `.tmp-14/libmodules/`（preserveModules 产物）
 * 的 core/utils/webgl2 三棵子树。
 *
 * 为什么废弃：
 *   1. 该 mode 后来改用 `.tmp-14/gen-subentries.mjs` 自动生成叶子模块 barrel
 *      （vite 会把 barrel 合进入口 chunk，preserveModules 产物里没有 `core/index.js`），
 *      所以手写的这一份被取代；
 *   2. 负责人/用户随后决定走**路 A**（`tsc` 直接输出模块树），`--mode modules` 整条路径
 *      不再是决策依据，只作为历史对照保留。
 *
 * 保留这个文件（而不是删掉）是为了让「路 B 曾存在过、为什么被放弃」在仓库里可查；
 * 它不参与任何构建，也不影响发布产物。当前有效的测量入口见 `.tmp-14/measure.mjs` 的
 * `--mode src`（源码）与 `--mode dist`（真实 tsc 模块树）。
 */

export {};
