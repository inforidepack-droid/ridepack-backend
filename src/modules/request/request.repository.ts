import mongoose from "mongoose";
import Booking from "@/modules/booking/booking.model";
import type { BookingLean } from "@/modules/booking/booking.repository";
import {
  BOOKING_STATUSES_FOR_ACCEPTED,
  BOOKING_STATUSES_FOR_PENDING,
  BOOKING_STATUSES_FOR_REJECTED,
  BOOKING_STATUS_CANCELLED,
  REQUEST_QUERY_STATUS,
  type RequestQueryStatus,
} from "@/modules/request/request.constants";

const statusesForFilter = (status?: RequestQueryStatus): string[] | null => {
  if (!status) return null;
  if (status === REQUEST_QUERY_STATUS.PENDING) return [...BOOKING_STATUSES_FOR_PENDING];
  if (status === REQUEST_QUERY_STATUS.ACCEPTED) return [...BOOKING_STATUSES_FOR_ACCEPTED];
  if (status === REQUEST_QUERY_STATUS.CANCELLED) return [BOOKING_STATUS_CANCELLED];
  if (status === REQUEST_QUERY_STATUS.REJECTED) return [...BOOKING_STATUSES_FOR_REJECTED];
  return null;
};

export const countSenderBookingsForRequestList = (
  senderId: string,
  status?: RequestQueryStatus
): Promise<number> => {
  const st = statusesForFilter(status);
  const filter: Record<string, unknown> = { senderId: new mongoose.Types.ObjectId(senderId) };
  if (st !== null) {
    if (st.length === 0) return Promise.resolve(0);
    filter.status = { $in: st };
  }
  return Booking.countDocuments(filter).exec();
};

export const findSenderBookingsForRequestList = (
  senderId: string,
  status: RequestQueryStatus | undefined,
  skip: number,
  limit: number,
  sortDir: 1 | -1
): Promise<BookingLean[]> => {
  const st = statusesForFilter(status);
  const filter: Record<string, unknown> = { senderId: new mongoose.Types.ObjectId(senderId) };
  if (st !== null) {
    if (st.length === 0) return Promise.resolve([]);
    filter.status = { $in: st };
  }
  return Booking.find(filter)
    .sort({ createdAt: sortDir })
    .skip(skip)
    .limit(limit)
    .populate({
      path: "tripId",
      select:
        "fromLocation toLocation travelDate departureTime arrivalTime riderId status capacity remainingCapacity price vehicleType publishedAt createdAt updatedAt",
      populate: {
        path: "riderId",
        select:
          "firstName lastName name profileImage ratingAverage ratingCount phoneNumber countryCode",
      },
    })
    .lean()
    .exec() as Promise<BookingLean[]>;
};
