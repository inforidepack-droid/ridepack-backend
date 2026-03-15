import { Router } from "express";
import { authenticate } from "@/middlewares/auth";
import { getParcelTrackingController } from "@/modules/tracking/tracking.controller";

const router = Router();

router.get("/:parcelId/tracking", authenticate, getParcelTrackingController);

export default router;
