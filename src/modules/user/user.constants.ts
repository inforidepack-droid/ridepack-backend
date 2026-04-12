export const USER_CONSTANTS = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  PROFILE_NAME_MAX: 120,
  PROFILE_IMAGE_MAX_LEN: 2048,
  /** Single `address` field on user profile */
  ADDRESS_MAX: 1000,
  /** FCM / push registration token (PATCH profile) */
  FCM_TOKEN_MAX: 4096,
  DEVICE_TYPES: ["android", "ios", "web"] as const,
} as const;
