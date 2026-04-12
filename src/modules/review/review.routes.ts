import { Router } from "express";
import { authenticate } from "@/middlewares/auth";
import { validateZod } from "@/middlewares/zodValidation";
import { createReviewBodySchema } from "@/modules/review/review.validation";
import {
  createReviewController,
  getReviewByIdController,
  getRiderRatingSummaryController,
  listRiderReviewsController,
} from "@/modules/review/review.controller";

const router = Router();

router.post("/", authenticate, validateZod(createReviewBodySchema), createReviewController);
router.get("/rider/:riderId/summary", authenticate, getRiderRatingSummaryController);
router.get("/rider/:riderId", authenticate, listRiderReviewsController);
router.get("/:id", authenticate, getReviewByIdController);

export default router;
