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
  phoneNumber: string;
  countryCode: string;
  isPhoneVerified: boolean;
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
