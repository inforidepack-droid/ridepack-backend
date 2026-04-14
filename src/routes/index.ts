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
import locationRoutes from "@/modules/tracking/location.routes";
import trackingRoutes from "@/modules/tracking/tracking.routes";
import vehicleRoutes from "@/modules/vehicle/vehicle.routes";
import chatRoutes from "@/modules/chat/chat.routes";
import reviewRoutes from "@/modules/review/review.routes";
import walletRoutes from "@/modules/wallet/wallet.routes";
import requestRoutes from "@/modules/request/request.routes";
import notificationRoutes from "@/modules/notifications/notification.routes";

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
router.use("/location", locationRoutes);
router.use("/parcels", trackingRoutes);
router.use("/webhooks", veriffWebhookRouter);
router.use("/webhooks", stripeWebhookRouter);
router.use("/vehicles", vehicleRoutes);
router.use("/chat", chatRoutes);
router.use("/reviews", reviewRoutes);
router.use("/wallet", walletRoutes);
router.use("/requests", requestRoutes);
router.use("/notifications", notificationRoutes);

export default router;
