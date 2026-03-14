import { Router } from "express";
import userRoutes from "@/modules/user/user.routes";
import authRoutes from "@/modules/auth/auth.routes";
import rideRoutes from "@/modules/ride/ride.routes";
import uploadRoutes from "@/modules/upload/upload.routes";
import tripRoutes from "@/modules/trip/trip.routes";
import bookingRoutes from "@/modules/booking/booking.routes";
import riderRoutes from "@/modules/rider/rider.routes";
import verificationRoutes, {
  veriffWebhookRouter,
} from "@/modules/verification/verification.routes";
import paymentsRoutes from "@/modules/payments/payment.routes";
import stripeRoutes, { stripeWebhookRouter } from "@/modules/stripe/stripe.routes";

const router = Router();

router.use("/user", userRoutes);
router.use("/riders", riderRoutes);
router.use("/auth", authRoutes);
router.use("/ride", rideRoutes);
router.use("/upload", uploadRoutes);
router.use("/trips", tripRoutes);
router.use("/bookings", bookingRoutes);
router.use("/verification", verificationRoutes);
router.use("/payments", paymentsRoutes);
router.use("/stripe", stripeRoutes);
router.use("/webhooks", veriffWebhookRouter);
router.use("/webhooks", stripeWebhookRouter);

export default router;
