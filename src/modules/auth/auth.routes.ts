import { Router } from "express";
import { registerController, loginController, refreshTokenController, logoutController } from "@/modules/auth/auth.controller";
import { registerValidation, loginValidation, refreshTokenValidation } from "@/modules/auth/auth.validation";
import { authenticate } from "@/middlewares/auth";
import { authLimiter } from "@/middlewares/rateLimiter";
import { validate } from "@/middlewares/validation";

const router = Router();

router.post("/register", authLimiter, registerValidation(), validate, registerController);
router.post("/login", authLimiter, loginValidation(), validate, loginController);
router.post("/refresh-token", refreshTokenValidation(), validate, refreshTokenController);
router.post("/logout", authenticate, logoutController);

export default router;
