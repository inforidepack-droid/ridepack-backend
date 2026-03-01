import { Router } from "express";
import userRoutes from "@/modules/user/user.routes";
import authRoutes from "@/modules/auth/auth.routes";
import rideRoutes from "@/modules/ride/ride.routes";
import uploadRoutes from "@/modules/upload/upload.routes";
import tripRoutes from "@/modules/trip/trip.routes";
import bookingRoutes from "@/modules/booking/booking.routes";
import riderRoutes from "@/modules/rider/rider.routes";

const router = Router();

router.use("/user", userRoutes);
router.use("/riders", riderRoutes);
router.use("/auth", authRoutes);
router.use("/ride", rideRoutes);
router.use("/upload", uploadRoutes);
router.use("/trips", tripRoutes);
router.use("/bookings", bookingRoutes);

export default router;
