export const ROLES = {
  USER: "user",
  DRIVER: "driver",
  ADMIN: "admin",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LIST: Role[] = [ROLES.USER, ROLES.DRIVER, ROLES.ADMIN];
