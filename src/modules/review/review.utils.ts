import mongoose from "mongoose";
import { REVIEW_COMMENT_MAX, REVIEW_CATEGORY_KEYS } from "@/modules/review/review.constants";
import type { ReviewLean, ReviewRatingsDoc, ReviewRatingsInput } from "@/modules/review/review.types";

export const isValidObjectId = (id: string): boolean =>
  mongoose.Types.ObjectId.isValid(id) && new mongoose.Types.ObjectId(id).toString() === id;

export const sanitizeReviewComment = (raw: string | undefined): string | undefined => {
  if (raw === undefined || raw === null) return undefined;
  const stripped = raw.trim().replace(/<[^>]*>/g, "").slice(0, REVIEW_COMMENT_MAX);
  return stripped.length > 0 ? stripped : undefined;
};

export const computePerReviewAverage = (r: ReviewRatingsInput | ReviewRatingsDoc): number => {
  const sum = REVIEW_CATEGORY_KEYS.reduce((acc, k) => acc + r[k], 0);
  return sum / REVIEW_CATEGORY_KEYS.length;
};

export const roundRatingOneDecimal = (n: number): number => Math.round(n * 10) / 10;

export const nextRollingAverage = (
  oldAverage: number,
  oldCount: number,
  newReviewAverage: number
): { ratingAverage: number; ratingCount: number } => {
  const ratingCount = oldCount + 1;
  const raw =
    oldCount === 0 ? newReviewAverage : (oldAverage * oldCount + newReviewAverage) / ratingCount;
  return { ratingAverage: roundRatingOneDecimal(raw), ratingCount };
};

export const mapReviewToResponse = (r: ReviewLean) => ({
  id: r._id.toString(),
  bookingId: r.bookingId.toString(),
  senderId: r.senderId.toString(),
  riderId: r.riderId.toString(),
  ratings: r.ratings,
  averageRating: r.averageRating,
  ...(r.comment !== undefined && r.comment !== "" ? { comment: r.comment } : {}),
  createdAt: r.createdAt,
});
