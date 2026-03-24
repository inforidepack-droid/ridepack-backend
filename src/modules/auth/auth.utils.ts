import type { AuthUserResponse } from "@/modules/auth/auth.types";

export interface UserLike {
  _id: { toString(): string };
  email?: string | null;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  gender?: string | null;
  phoneNumber?: string | null;
  countryCode?: string | null;
  isPhoneVerified?: boolean;
  isEmailVerified?: boolean;
  isVerified?: boolean;
  role?: string;
  profileImage?: string | null;
  verification?: { status?: string | null } | null;
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
  firstName: user.firstName ?? "",
  lastName: user.lastName ?? "",
  gender: user.gender ?? "",
  profileImage: user.profileImage ?? "",
  phoneNumber: user.phoneNumber ?? "",
  countryCode: user.countryCode ?? "",
  isPhoneVerified: user.isPhoneVerified ?? false,
  isEmailVerified: user.isEmailVerified ?? false,
  isVerified: user.isVerified ?? false,
  idVerificationStatus: user.verification?.status ?? "not_started",
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
