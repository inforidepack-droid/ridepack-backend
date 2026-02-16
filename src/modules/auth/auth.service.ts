import bcrypt from "bcryptjs";
import { Model } from "mongoose";
import { RegisterDto, LoginDto, AuthResponse, RefreshTokenDto } from "@/modules/auth/auth.types";
import { generateToken, generateRefreshToken, verifyRefreshToken, TokenPayload } from "@/libs/jwt";
import { createError } from "@/middlewares/errorHandler";
import { redisClient } from "@/config/redis";
import User, { IUser } from "@/modules/auth/models/User.model";

const UserModel = User as Model<IUser>;

export const register = async (registerDto: RegisterDto): Promise<AuthResponse> => {
  const { email, password, name } = registerDto;

  // Check if user already exists
  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    throw createError("User with this email already exists", 409);
  }

  // Hash password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user
  const user = new UserModel({
    email,
    password: hashedPassword,
    name,
  });

  await user.save();

  // Generate tokens
  const tokenPayload: TokenPayload = {
    userId: user._id.toString(),
    email: user.email,
  };

  const token = generateToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Store refresh token in Redis
  await redisClient.setEx(`refresh_token:${user._id}`, 30 * 24 * 60 * 60, refreshToken); // 30 days

  return {
    success: true,
    data: {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
      token,
      refreshToken,
    },
  };
};

export const login = async (loginDto: LoginDto): Promise<AuthResponse> => {
  const { email, password } = loginDto;

  // Find user with password field
  const user = await UserModel.findOne({ email }).select("+password");
  if (!user) {
    throw createError("Invalid email or password", 401);
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw createError("Invalid email or password", 401);
  }

  // Generate tokens
  const tokenPayload: TokenPayload = {
    userId: user._id.toString(),
    email: user.email,
  };

  const token = generateToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Store refresh token in Redis
  await redisClient.setEx(`refresh_token:${user._id}`, 30 * 24 * 60 * 60, refreshToken); // 30 days

  return {
    success: true,
    data: {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
      token,
      refreshToken,
    },
  };
};

export const refreshToken = async (refreshTokenDto: RefreshTokenDto): Promise<{ token: string; refreshToken: string }> => {
  const { refreshToken } = refreshTokenDto;

  // Verify refresh token
  const decoded = verifyRefreshToken(refreshToken);

  // Check if refresh token exists in Redis
  const storedToken = await redisClient.get(`refresh_token:${decoded.userId}`);
  if (!storedToken || storedToken !== refreshToken) {
    throw createError("Invalid refresh token", 401);
  }

  // Generate new tokens
  const tokenPayload: TokenPayload = {
    userId: decoded.userId,
    email: decoded.email,
  };

  const newToken = generateToken(tokenPayload);
  const newRefreshToken = generateRefreshToken(tokenPayload);

  // Update refresh token in Redis
  await redisClient.setEx(`refresh_token:${decoded.userId}`, 30 * 24 * 60 * 60, newRefreshToken);

  return {
    token: newToken,
    refreshToken: newRefreshToken,
  };
};

export const logout = async (userId: string): Promise<void> => {
  // Remove refresh token from Redis
  await redisClient.del(`refresh_token:${userId}`);
};
