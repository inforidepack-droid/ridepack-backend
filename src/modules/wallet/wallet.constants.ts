export const WALLET_MIN_WITHDRAW_USD = 10;
export const WALLET_DEFAULT_CURRENCY = "usd";

export const WALLET_TX_TYPE = {
  CREDIT: "credit",
  DEBIT: "debit",
} as const;

export const WALLET_TX_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export const WALLET_TX_SOURCE = {
  DELIVERY: "delivery",
  WITHDRAWAL: "withdrawal",
} as const;

export type WalletTxType = (typeof WALLET_TX_TYPE)[keyof typeof WALLET_TX_TYPE];
export type WalletTxStatus = (typeof WALLET_TX_STATUS)[keyof typeof WALLET_TX_STATUS];
export type WalletTxSource = (typeof WALLET_TX_SOURCE)[keyof typeof WALLET_TX_SOURCE];

export const WALLET_TX_LIST_DEFAULT_LIMIT = 20;
export const WALLET_TX_LIST_MAX_LIMIT = 50;
