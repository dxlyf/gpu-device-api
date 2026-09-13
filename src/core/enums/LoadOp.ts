/** What to do with an attachment when a render pass begins. */
export const LoadOp = {
  Load: 'load',
  Clear: 'clear',
} as const;

export type LoadOp = (typeof LoadOp)[keyof typeof LoadOp];
