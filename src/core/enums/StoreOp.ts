/** What to do with an attachment when a render pass ends. */
export const StoreOp = {
  Store: 'store',
  Discard: 'discard',
} as const;

export type StoreOp = (typeof StoreOp)[keyof typeof StoreOp];
