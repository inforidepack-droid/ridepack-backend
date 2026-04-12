import type mongoose from "mongoose";
import type { ReviewCategoryKey } from "@/modules/review/review.constants";

export type ReviewRatingsInput = Record<ReviewCategoryKey, number>;

export type ReviewRatingsDoc = {
  communication: number;
  punctuality: number;
  packageCare: number;
  handoffExperience: number;
  professionalism: number;
};

export type CreateReviewBody = {
  bookingId: string;
  ratings: ReviewRatingsInput;
  comment?: string;
};

export type ReviewLean = {
  _id: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  riderId: mongoose.Types.ObjectId;
  ratings: ReviewRatingsDoc;
  averageRating: number;
  comment?: string;
  createdAt: Date;
};
