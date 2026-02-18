import { Router } from "express";
import { refreshTokenController, logoutController } from "@/modules/auth/auth.controller";
import { refreshTokenValidation } from "@/modules/auth/auth.validation";
import { sendOtpController, verifyOtpController } from "@/modules/auth/auth.otp.controller";
import { sendOtpSchema, verifyOtpSchema } from "@/modules/auth/auth.otp.validation";
import { authenticate } from "@/middlewares/auth";
import { authLimiter } from "@/middlewares/rateLimiter";
import { validate } from "@/middlewares/validation";
import { validateZod } from "@/middlewares/zodValidation";
import { googleCallback } from "@/modules/auth/auth.controller";
import passport from "passport";

const router = Router();

router.get('/google',passport.authenticate("google",{
    scope:["profile","email"],
    session:false
})
);

router.get('/google/callback',passport.authenticate("google",{
    session:false,
    failureRedirect:"/login"
}),
googleCallback
);  

router.get("/debug", (req, res) => {
  res.send("Auth router working");
});

router.post("/refresh-token", refreshTokenValidation(), validate, refreshTokenController);
router.post("/logout", authenticate, logoutController);

router.post("/send-otp", authLimiter, validateZod(sendOtpSchema), sendOtpController);
router.post("/verify-otp", authLimiter, validateZod(verifyOtpSchema), verifyOtpController);

export default router;
