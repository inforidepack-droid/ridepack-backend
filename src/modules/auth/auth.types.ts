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

export interface VerifyOtpResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      phoneNumber: string;
      countryCode: string;
      isPhoneVerified: boolean;
    };
    accessToken: string;
    refreshToken: string;
  };
}
