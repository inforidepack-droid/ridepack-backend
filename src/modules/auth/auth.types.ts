export interface RefreshTokenDto {
  refreshToken: string;
}

/**
 * US (+1) or India (+91) OTP. Either:
 * - `countryCode: "+1" | "+91"` + national `phoneNumber`, or
 * - E.164 in `phoneNumber`; omit `countryCode` or set it to match.
 */
export interface SendOtpDto {
  countryCode?: string;
  phoneNumber: string;
}

/** Same phone shape as send-otp; OTP is 4 digits. Optional push fields (same as PATCH /api/user/profile). */
export interface VerifyOtpDto {
  countryCode?: string;
  phoneNumber: string;
  otp: string;
  /** Same as PATCH /api/user/profile — optional push registration on login. */
  fcmToken?: string;
  deviceType?: string;
}

export interface OtpResponse {
  success: boolean;
  message: string;
}

/** User in auth responses – all fields present (empty string when not set) so backend/clients don't crash. */
export interface AuthUserResponse {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  gender: string;
  profileImage: string;
  /** Single free-form address string. */
  address: string;
  phoneNumber: string;
  countryCode: string;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  /** True when Veriff KYC approved (synced with webhook); use with idVerificationStatus */
  isVerified: boolean;
  /** Veriff KYC: not_started | pending | approved | declined | expired */
  idVerificationStatus: string;
  role: string;
  /** 5-digit pickup handoff OTP for parcel bookings; empty if not set yet. */
  profileOtp: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VerifyOtpResponse {
  success: boolean;
  data: {
    user: AuthUserResponse;
    accessToken: string;
    refreshToken: string;
  };
}

export interface GoogleAuthRequestBody {
  idToken: string;
}

export interface GoogleAuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    profileImage: string;
    role: string;
  };
}
