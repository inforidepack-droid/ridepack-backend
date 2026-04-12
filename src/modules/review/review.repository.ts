import mongoose from "mongoose";
import Review from "@/modules/review/review.model";
import type { ReviewLean, ReviewRatingsDoc } from "@/modules/review/review.types";

export const create = async (data: {
  bookingId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  riderId: mongoose.Types.ObjectId;
  ratings: ReviewRatingsDoc;
  averageRating: number;
  comment?: string;
}): Promise<ReviewLean> => {
  const doc = await Review.create(data);
  return doc.toObject() as ReviewLean;
};

export const findByBookingId = (bookingId: string): Promise<ReviewLean | null> =>
  Review.findOne({ bookingId: new mongoose.Types.ObjectId(bookingId) })
    .lean()
    .exec() as Promise<ReviewLean | null>;

export const findById = (id: string): Promise<ReviewLean | null> =>
  Review.findById(id).lean().exec() as Promise<ReviewLean | null>;

export const findByRiderIdPaginated = (
  riderId: string,
  skip: number,
  limit: number
): Promise<ReviewLean[]> =>
  Review.find({ riderId: new mongoose.Types.ObjectId(riderId) })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
    .exec() as Promise<ReviewLean[]>;

export const countByRiderId = (riderId: string): Promise<number> =>
  Review.countDocuments({ riderId: new mongoose.Types.ObjectId(riderId) }).exec();
