import mongoose from "mongoose";
import { MongoServerError } from "mongodb";
import { createError } from "@/utils/appError";
import { HTTP_STATUS } from "@/constants/http.constants";
import { BOOKING_STATUS } from "@/modules/booking/booking.constants";
import * as bookingRepo from "@/modules/booking/booking.repository";
import * as userRepo from "@/modules/user/user.repository";
import * as riderRepo from "@/modules/rider/rider.repository";
import * as reviewRepo from "@/modules/review/review.repository";
import {
  computePerReviewAverage,
  mapReviewToResponse,
  nextRollingAverage,
  roundRatingOneDecimal,
  sanitizeReviewComment,
  isValidObjectId,
} from "@/modules/review/review.utils";
import type { CreateReviewBody } from "@/modules/review/review.types";
import type { ListReviewsQuery } from "@/modules/review/review.validation";

const duplicateReviewMessage = "A review has already been submitted for this booking";

export const createReview = async (senderId: string, body: CreateReviewBody) => {
  const booking = await bookingRepo.findByIdWithTripRider(body.bookingId);
  if (!booking) throw createError("Booking not found", HTTP_STATUS.NOT_FOUND);

  if (booking.senderId.toString() !== senderId) {
    throw createError("Only the booking sender can submit a review", HTTP_STATUS.FORBIDDEN);
  }

  if (booking.status === BOOKING_STATUS.CANCELLED) {
    throw createError("Cannot review a cancelled booking", HTTP_STATUS.BAD_REQUEST);
  }
  if (booking.status !== BOOKING_STATUS.DELIVERED) {
    throw createError("Booking must be delivered before submitting a review", HTTP_STATUS.BAD_REQUEST);
  }

  const trip = booking.tripId;
  if (!trip?.riderId) {
    throw createError("Trip or rider not associated with this booking", HTTP_STATUS.BAD_REQUEST);
  }

  const riderIdStr = trip.riderId.toString();
  const riderUser = await userRepo.findById(riderIdStr);
  if (!riderUser) throw createError("Rider not found", HTTP_STATUS.NOT_FOUND);

  const existing = await reviewRepo.findByBookingId(body.bookingId);
  if (existing) throw createError(duplicateReviewMessage, HTTP_STATUS.BAD_REQUEST);

  const comment = sanitizeReviewComment(body.comment);
  const averageRating = roundRatingOneDecimal(computePerReviewAverage(body.ratings));

  try {
    const review = await reviewRepo.create({
      bookingId: new mongoose.Types.ObjectId(body.bookingId),
      senderId: new mongoose.Types.ObjectId(senderId),
      riderId: new mongoose.Types.ObjectId(riderIdStr),
      ratings: body.ratings,
      averageRating,
      ...(comment ? { comment } : {}),
    });

    const riderProfile = await riderRepo.findByUserId(riderIdStr);
    const u = riderUser as { ratingAverage?: number; ratingCount?: number };
    const oldAvg = riderProfile?.ratingAverage ?? u.ratingAverage ?? 0;
    const oldCount = riderProfile?.ratingCount ?? u.ratingCount ?? 0;
    const { ratingAverage, ratingCount } = nextRollingAverage(oldAvg, oldCount, averageRating);

    await userRepo.updateById(riderIdStr, { ratingAverage, ratingCount });

    const updatedRider = await riderRepo.updateRatingStatsByUserId(riderIdStr, {
      ratingAverage,
      ratingCount,
      rating: ratingAverage,
    });
    if (!updatedRider) throw createError("Rider profile not found", HTTP_STATUS.NOT_FOUND);

    return mapReviewToResponse(review);
  } catch (e) {
    if (e instanceof MongoServerError && e.code === 11000) {
      throw createError(duplicateReviewMessage, HTTP_STATUS.BAD_REQUEST);
    }
    throw e;
  }
};

export const getReviewById = async (id: string) => {
  if (!isValidObjectId(id)) throw createError("Invalid review id format", HTTP_STATUS.BAD_REQUEST);
  const review = await reviewRepo.findById(id);
  if (!review) throw createError("Review not found", HTTP_STATUS.NOT_FOUND);
  return mapReviewToResponse(review);
};

export const listRiderReviews = async (riderId: string, query: ListReviewsQuery) => {
  if (!isValidObjectId(riderId)) throw createError("Invalid rider id format", HTTP_STATUS.BAD_REQUEST);
  const riderUser = await userRepo.findById(riderId);
  if (!riderUser) throw createError("Rider not found", HTTP_STATUS.NOT_FOUND);

  const skip = (query.page - 1) * query.limit;
  const [reviews, total] = await Promise.all([
    reviewRepo.findByRiderIdPaginated(riderId, skip, query.limit),
    reviewRepo.countByRiderId(riderId),
  ]);

  return {
    reviews: reviews.map(mapReviewToResponse),
    page: query.page,
    limit: query.limit,
    total,
  };
};

export const getRiderRatingSummary = async (riderId: string) => {
  if (!isValidObjectId(riderId)) throw createError("Invalid rider id format", HTTP_STATUS.BAD_REQUEST);
  const riderUser = await userRepo.findById(riderId);
  if (!riderUser) throw createError("Rider not found", HTTP_STATUS.NOT_FOUND);
  const u = riderUser as { ratingAverage?: number; ratingCount?: number };
  return {
    ratingAverage: u.ratingAverage ?? 0,
    ratingCount: u.ratingCount ?? 0,
  };
};
