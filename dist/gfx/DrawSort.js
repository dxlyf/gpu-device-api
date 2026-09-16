/**
 * draw 排序：把同一帧里排队的绘制按「管线 → 纹理/绑定组 → 深度」重排，减少状态切换。
 *
 * ## 为什么不能无脑按状态排序
 *
 * 不透明物的绘制顺序不影响结果（每个像素最终留下的是深度测试的胜者），所以可以随意重排。
 * **半透明物不行**：混合是「结果 = src × f(dst)」这种不可交换的运算，同一像素上两个半透明面
 * 谁先画谁后画得到的是不同颜色。正确顺序是从远到近，而「按管线分组」正好会打乱它。
 *
 * 因此这里提供两种模式，取舍写在明处：
 *
 * - `'opaque'`：**只在不透明物的连续段内排序**。半透明物既是「不参与排序的元素」，也是
 *   「不可跨越的边界」—— 一段被半透明物隔开的不透明物绝不会被搬到它的另一边，
 *   所以半透明物与其它元素的先后关系与调用方提交的完全一致；
 * - `'all'`：不透明物按状态排序后整体在前，半透明物**只按深度从远到近**排序、整体在后，
 *   同深度时保持提交顺序。这是渲染器里最常见的两遍式顺序，但它**确实会改变**
 *   「半透明物与不透明物交错提交」时的结果 —— 那种交错本身就是错的（半透明物必须最后画），
 *   所以这个模式默认关闭，由调用方显式选择。
 *
 * 两种模式都**不会**在深度相同时打乱提交顺序（比较函数最后一级是提交序号）。
 */
/** 不透明物：管线 → 绑定组 → 由近到远（近的先画能更早被深度测试挡掉后面的像素）。 */
export function compareOpaque(a, b) {
    if (a.pipeline !== b.pipeline)
        return a.pipeline - b.pipeline;
    if (a.bindings !== b.bindings)
        return a.bindings - b.bindings;
    if (a.depth !== b.depth)
        return a.depth - b.depth;
    return a.order - b.order;
}
/**
 * 半透明物：只按深度**从远到近**。
 *
 * 这里刻意不把管线/绑定组放进比较的前几级：那样会把「同一个管线的两个半透明面」凑到一起，
 * 而它们本来可能隔着别的管线、且远近关系相反 —— 那是会画出错误颜色的。
 */
export function compareTransparent(a, b) {
    if (a.depth !== b.depth)
        return b.depth - a.depth;
    return a.order - b.order;
}
/**
 * 就地排序。`'none'` 与元素数小于 2 时是空操作。
 */
export function sortDraws(items, mode) {
    if (mode === 'none' || items.length < 2)
        return;
    if (mode === 'opaque') {
        // 只在不透明物的连续段内排序；半透明物是段边界（见文件头说明）。
        let start = 0;
        while (start < items.length) {
            if (items[start].transparent) {
                start += 1;
                continue;
            }
            let end = start + 1;
            while (end < items.length && !items[end].transparent)
                end += 1;
            if (end - start > 1)
                sortRange(items, start, end, compareOpaque);
            start = end;
        }
        return;
    }
    // 'all'：不透明物整体在前（按状态排序），半透明物整体在后（只按深度从远到近）。
    const opaque = [];
    const transparent = [];
    for (const item of items) {
        if (item.transparent)
            transparent.push(item);
        else
            opaque.push(item);
    }
    opaque.sort(compareOpaque);
    transparent.sort(compareTransparent);
    let cursor = 0;
    for (const item of opaque)
        items[cursor++] = item;
    for (const item of transparent)
        items[cursor++] = item;
}
/** 对 `[start, end)` 这一段排序（用切片 + 稳定排序，避免依赖 `Array.sort` 的原地比较次数）。 */
function sortRange(items, start, end, compare) {
    const slice = items.slice(start, end);
    slice.sort(compare);
    for (let index = 0; index < slice.length; index += 1)
        items[start + index] = slice[index];
}
//# sourceMappingURL=DrawSort.js.map