/** render pass 结束时对 attachment 的处理方式。 */
export const StoreOp = {
  Store: 'store',
  Discard: 'discard',
} as const;

export type StoreOp = (typeof StoreOp)[keyof typeof StoreOp];
