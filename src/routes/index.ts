import { Router } from "express";
import userRoutes from "@/modules/user/user.routes";
import authRoutes from "@/modules/auth/auth.routes";
import rideRoutes from "@/modules/ride/ride.routes";

const router = Router();

router.use("/user", userRoutes);
router.use("/auth", authRoutes);
router.use("/ride", rideRoutes);

export default router;
