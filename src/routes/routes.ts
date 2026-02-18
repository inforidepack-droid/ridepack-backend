import { Router } from "express";
import authRoutes from "@/modules/auth/auth.routes";

const router = Router();
console.log("Routes file loaded");
router.use("/auth", authRoutes);
console.log("Routes file loaded");

export default router;
