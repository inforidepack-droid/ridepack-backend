import type { AuthUserResponse } from "@/modules/auth/auth.types";

export interface UserLike {
  _id: { toString(): string };
  email?: string | null;
  name?: string | null;
  phoneNumber?: string | null;
  countryCode?: string | null;
  isPhoneVerified?: boolean;
  role?: string;
  profileImage?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GoogleAuthUserResponse {
  id: string;
  name: string;
  email: string;
  profileImage: string;
  role: string;
}

export const toAuthUserResponse = (user: UserLike): AuthUserResponse => ({
  id: user._id.toString(),
  email: user.email ?? "",
  name: user.name ?? "",
  phoneNumber: user.phoneNumber ?? "",
  countryCode: user.countryCode ?? "",
  isPhoneVerified: user.isPhoneVerified ?? false,
  role: user.role ?? "user",
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const toGoogleAuthUserResponse = (user: UserLike): GoogleAuthUserResponse => ({
  id: user._id.toString(),
  name: user.name ?? "",
  email: user.email ?? "",
  profileImage: user.profileImage ?? "",
  role: user.role ?? "sender",
});
