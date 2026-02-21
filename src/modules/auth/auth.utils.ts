import type { AuthUserResponse } from "@/modules/auth/auth.types";

type UserLike = {
  _id: { toString(): string };
  email?: string | null;
  name?: string | null;
  phoneNumber?: string | null;
  countryCode?: string | null;
  isPhoneVerified?: boolean;
  role?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

const emptyStr = (v: string | null | undefined): string => (v != null && v !== "" ? String(v) : "");
const safeBool = (v: boolean | null | undefined): boolean => Boolean(v);
const safeStr = (v: string | null | undefined, fallback: string): string =>
  v != null && v !== "" ? String(v) : fallback;
const safeDate = (v: Date | null | undefined): Date => (v instanceof Date && !Number.isNaN(v.getTime()) ? v : new Date());

/**
 * Shapes a user document into a safe API response. Use for first-time (OTP) and updated users
 * so optional fields (email, name) never cause crashes and response is always consistent.
 */
export const toAuthUserResponse = (user: UserLike): AuthUserResponse => ({
  id: user._id.toString(),
  email: emptyStr(user.email),
  name: emptyStr(user.name),
  phoneNumber: emptyStr(user.phoneNumber),
  countryCode: emptyStr(user.countryCode),
  isPhoneVerified: safeBool(user.isPhoneVerified),
  role: safeStr(user.role, "user"),
  createdAt: safeDate(user.createdAt),
  updatedAt: safeDate(user.updatedAt),
});
