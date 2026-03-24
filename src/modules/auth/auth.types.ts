export interface RefreshTokenDto {
  refreshToken: string;
}

export interface SendOtpDto {
  countryCode: string;
  phoneNumber: string;
}

export interface VerifyOtpDto {
  countryCode: string;
  phoneNumber: string;
  otp: string;
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
  phoneNumber: string;
  countryCode: string;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  /** True when Veriff KYC approved (synced with webhook); use with idVerificationStatus */
  isVerified: boolean;
  /** Veriff KYC: not_started | pending | approved | declined | expired */
  idVerificationStatus: string;
  role: string;
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
