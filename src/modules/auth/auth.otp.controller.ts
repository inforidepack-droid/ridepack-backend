import { Request, Response } from "express";
import { asyncHandler } from "@/middlewares/asyncHandler";
import { sendSuccess } from "@/utils/responseFormatter";
import { sendOtp, verifyOtp } from "@/modules/auth/auth.otp.service";
import { SendOtpDto, VerifyOtpDto } from "@/modules/auth/auth.types";

export const sendOtpController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const sendOtpDto: SendOtpDto = req.body;
  const result = await sendOtp(sendOtpDto);
  sendSuccess(res, { message: result.message });
});

export const verifyOtpController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const verifyOtpDto: VerifyOtpDto = req.body;
  const result = await verifyOtp(verifyOtpDto);
  sendSuccess(res, { data: result.data });
});
