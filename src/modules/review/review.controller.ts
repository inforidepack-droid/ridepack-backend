import { Response } from "express";
import { asyncHandler } from "@/middlewares/asyncHandler";
import { createError } from "@/utils/appError";
import { HTTP_STATUS } from "@/constants/http.constants";
import { sendSuccess, sendCreated } from "@/utils/responseFormatter";
import type { AuthRequest } from "@/middlewares/auth";
import { listReviewsQuerySchema } from "@/modules/review/review.validation";
import type { CreateReviewBody } from "@/modules/review/review.types";
import {
  createReview,
  getReviewById,
  getRiderRatingSummary,
  listRiderReviews,
} from "@/modules/review/review.service";
import { isValidObjectId } from "@/modules/review/review.utils";

export const createReviewController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw createError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    const review = await createReview(req.user.userId, req.body as CreateReviewBody);
    sendCreated(res, { data: { review } });
  }
);

export const getReviewByIdController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw createError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    const review = await getReviewById(req.params.id as string);
    sendSuccess(res, { data: { review } });
  }
);

export const listRiderReviewsController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw createError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    const riderId = req.params.riderId as string;
    if (!isValidObjectId(riderId)) {
      throw createError("Invalid rider id format", HTTP_STATUS.BAD_REQUEST);
    }
    const parsed = listReviewsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join(", ");
      throw createError(msg, HTTP_STATUS.BAD_REQUEST);
    }
    const result = await listRiderReviews(riderId, parsed.data);
    sendSuccess(res, { data: result });
  }
);

export const getRiderRatingSummaryController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw createError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    const riderId = req.params.riderId as string;
    if (!isValidObjectId(riderId)) {
      throw createError("Invalid rider id format", HTTP_STATUS.BAD_REQUEST);
    }
    const summary = await getRiderRatingSummary(riderId);
    sendSuccess(res, { data: summary });
  }
);
