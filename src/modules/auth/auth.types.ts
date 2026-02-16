export interface RegisterDto {
  email: string;
  password: string;
  name: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      email: string;
      name: string;
    };
    token: string;
    refreshToken: string;
  };
}

export interface RefreshTokenDto {
  refreshToken: string;
}
