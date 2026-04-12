import mongoose, { Schema, Document, Model } from "mongoose";
import type { ReviewRatingsDoc } from "@/modules/review/review.types";
import {
  REVIEW_RATING_MAX,
  REVIEW_RATING_MIN,
  REVIEW_COMMENT_MAX,
} from "@/modules/review/review.constants";

export interface IReview extends Document {
  bookingId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  riderId: mongoose.Types.ObjectId;
  ratings: ReviewRatingsDoc;
  averageRating: number;
  comment?: string;
  createdAt: Date;
}

const ratingField = {
  type: Number,
  required: true,
  min: REVIEW_RATING_MIN,
  max: REVIEW_RATING_MAX,
};

const ratingsSchema = new Schema<ReviewRatingsDoc>(
  {
    communication: ratingField,
    punctuality: ratingField,
    packageCare: ratingField,
    handoffExperience: ratingField,
    professionalism: ratingField,
  },
  { _id: false }
);

const reviewSchema = new Schema<IReview>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    riderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ratings: { type: ratingsSchema, required: true },
    averageRating: { type: Number, required: true, min: REVIEW_RATING_MIN, max: REVIEW_RATING_MAX },
    comment: { type: String, maxlength: REVIEW_COMMENT_MAX, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

reviewSchema.index({ riderId: 1, createdAt: -1 });
reviewSchema.index({ senderId: 1 });

const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>("Review", reviewSchema);
export default Review;
