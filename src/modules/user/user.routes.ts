import { Router } from "express";
import { getProfileController, updateProfileController } from "@/modules/user/user.controller";
import { updateProfileValidation } from "@/modules/user/user.validation";
import { authenticate } from "@/middlewares/auth";
import { validate } from "@/middlewares/validation";

const router = Router();

router.get("/profile", authenticate, getProfileController);
router.patch("/profile", authenticate, updateProfileValidation(), validate, updateProfileController);

export default router;
