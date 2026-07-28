export const BaseStates = {
  SUCCESS: "SUCCESS",
  ERROR: "ERROR"
} as const;

export type BaseStates = (typeof BaseStates)[keyof typeof BaseStates];
