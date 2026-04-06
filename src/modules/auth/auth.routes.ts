import { Router } from "express";
import {
  refreshTokenController,
  logoutController,
  googleAuthController,
} from "@/modules/auth/auth.controller";
import { refreshTokenValidation } from "@/modules/auth/auth.validation";
import otpRoutes from "@/modules/auth/otp.routes";
import { googleAuthSchema } from "@/modules/auth/auth.google.validation";
import { authenticate } from "@/middlewares/auth";
import { validate } from "@/middlewares/validation";
import { validateZod } from "@/middlewares/zodValidation";

const router = Router();

router.post("/refresh-token", refreshTokenValidation(), validate, refreshTokenController);
router.post("/logout", authenticate, logoutController);

router.use(otpRoutes);

router.post("/google", validateZod(googleAuthSchema), googleAuthController);

export default router;
