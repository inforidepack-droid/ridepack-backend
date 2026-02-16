import { Request, Response } from "express";
import { asyncHandler } from "@/middlewares/asyncHandler";
import { sendOtp, verifyOtp } from "@/modules/auth/auth.otp.service";
import { SendOtpDto, VerifyOtpDto } from "@/modules/auth/auth.types";

export const sendOtpController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const sendOtpDto: SendOtpDto = req.body;
  const result = await sendOtp(sendOtpDto);
  res.status(200).json(result);
});

export const verifyOtpController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const verifyOtpDto: VerifyOtpDto = req.body;
  const result = await verifyOtp(verifyOtpDto);
  res.status(200).json(result);
});
