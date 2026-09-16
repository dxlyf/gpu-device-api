/**
 * core 层与各后端之间共享的内部类型。它们不属于公开 API，
 * 可能随时变更。
 *
 * （保留为真实模块而非 `.d.ts`，以便声明生成时能将其拷贝到 `dist/types`。）
 */
export function bindingKey(group, binding) {
    return `${group}:${binding}`;
}
//# sourceMappingURL=internal.js.map