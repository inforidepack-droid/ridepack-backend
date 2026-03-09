export const VERIFICATION_PROVIDER = {
  VERIFF: "veriff",
} as const;

export const VERIFICATION_STATUS = {
  NOT_STARTED: "not_started",
  PENDING: "pending",
  APPROVED: "approved",
  DECLINED: "declined",
  EXPIRED: "expired",
} as const;

export type VerificationStatus = (typeof VERIFICATION_STATUS)[keyof typeof VERIFICATION_STATUS];

