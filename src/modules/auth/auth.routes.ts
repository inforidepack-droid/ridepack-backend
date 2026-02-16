import { Router } from "express";
import { refreshTokenController, logoutController } from "@/modules/auth/auth.controller";
import { refreshTokenValidation } from "@/modules/auth/auth.validation";
import { sendOtpController, verifyOtpController } from "@/modules/auth/auth.otp.controller";
import { sendOtpSchema, verifyOtpSchema } from "@/modules/auth/auth.otp.validation";
import { authenticate } from "@/middlewares/auth";
import { authLimiter } from "@/middlewares/rateLimiter";
import { validate } from "@/middlewares/validation";
import { validateZod } from "@/middlewares/zodValidation";

const router = Router();

router.post("/refresh-token", refreshTokenValidation(), validate, refreshTokenController);
router.post("/logout", authenticate, logoutController);

router.post("/send-otp", authLimiter, validateZod(sendOtpSchema), sendOtpController);
router.post("/verify-otp", authLimiter, validateZod(verifyOtpSchema), verifyOtpController);

export default router;
