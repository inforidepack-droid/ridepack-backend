export const API_STATUS = {
  SUCCESS: "success",
  FAIL: "fail",
  ERROR: "error",
} as const;

export type ApiStatus = (typeof API_STATUS)[keyof typeof API_STATUS];
