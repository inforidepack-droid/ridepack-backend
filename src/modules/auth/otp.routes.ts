import { Router } from "express";
import { sendOtpController, verifyOtpController } from "@/modules/auth/otp.controller";
import { sendOtpSchema, verifyOtpSchema } from "@/modules/auth/otp.validation";
import { validateZod } from "@/middlewares/zodValidation";

const router = Router();

router.post("/send-otp", validateZod(sendOtpSchema), sendOtpController);
router.post("/verify-otp", validateZod(verifyOtpSchema), verifyOtpController);

export default router;
