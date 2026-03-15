import { Router } from "express";
import { refreshTokenController, logoutController, googleAuthController } from "@/modules/auth/auth.controller";
import { refreshTokenValidation } from "@/modules/auth/auth.validation";
import { sendOtpController, verifyOtpController } from "@/modules/auth/auth.otp.controller";
import { sendOtpSchema, verifyOtpSchema } from "@/modules/auth/auth.otp.validation";
import { googleAuthSchema } from "@/modules/auth/auth.google.validation";
import { authenticate } from "@/middlewares/auth";
import { validate } from "@/middlewares/validation";
import { validateZod } from "@/middlewares/zodValidation";

const router = Router();

router.post("/refresh-token", refreshTokenValidation(), validate, refreshTokenController);
router.post("/logout", authenticate, logoutController);

router.post("/send-otp", validateZod(sendOtpSchema), sendOtpController);
router.post("/verify-otp", validateZod(verifyOtpSchema), verifyOtpController);

router.post("/google", validateZod(googleAuthSchema), googleAuthController);

export default router;
