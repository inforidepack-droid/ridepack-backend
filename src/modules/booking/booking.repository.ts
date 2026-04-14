import mongoose from "mongoose";
import Booking, { IBooking } from "@/modules/booking/booking.model";
import Trip from "@/modules/trip/trip.model";
import { BOOKING_STATUS } from "@/modules/booking/booking.constants";
import { TRIP_STATUS } from "@/modules/trip/trip.constants";
import { PARCEL_OTP_MAX_ATTEMPTS } from "@/modules/booking/booking.parcelOtp.constants";

export type BookingLean = Omit<IBooking, keyof mongoose.Document> & {
  _id: mongoose.Types.ObjectId;
};

export type CreateBookingInput = {
  tripId: string;
  senderId: string;
  parcel: IBooking["parcel"];
  senderDetails: IBooking["senderDetails"];
  receiverDetails: IBooking["receiverDetails"];
  packageImages: string[];
  agreedPrice: number;
  illegalItemsDeclaration: boolean;
  deliveryOtp: string;
};

export const create = (data: CreateBookingInput): Promise<BookingLean> =>
  Booking.create({
    ...data,
    tripId: new mongoose.Types.ObjectId(data.tripId),
    senderId: new mongoose.Types.ObjectId(data.senderId),
    status: BOOKING_STATUS.PENDING_RIDER_ACCEPT,
  }).then((doc) => doc.toObject() as BookingLean);

export const findById = (bookingId: string): Promise<BookingLean | null> =>
  Booking.findById(bookingId).lean().exec() as Promise<BookingLean | null>;

export const deleteById = (bookingId: string): Promise<void> =>
  Booking.findByIdAndDelete(bookingId)
    .exec()
    .then(() => undefined);

export type BookingTripRiderForOtpLean = Omit<BookingLean, "tripId"> & {
  tripId: { _id: mongoose.Types.ObjectId; riderId: mongoose.Types.ObjectId; status?: string } | null;
  deliveryOtp?: string;
};

/** Backfills missing OTP subdocs on legacy booking documents (Mongo pipeline update). */
export const mergeMissingParcelOtpFields = async (bookingId: string): Promise<void> => {
  await Booking.updateOne(
    { _id: new mongoose.Types.ObjectId(bookingId) },
    [
      {
        $set: {
          otpAttempts: {
            pickup: { $ifNull: ["$otpAttempts.pickup", 0] },
            delivery: { $ifNull: ["$otpAttempts.delivery", 0] },
          },
          otpVerification: {
            pickupVerified: { $ifNull: ["$otpVerification.pickupVerified", false] },
            deliveryVerified: { $ifNull: ["$otpVerification.deliveryVerified", false] },
          },
        },
      },
    ]
  ).exec();
};

export const findByIdWithTripForParcelOtp = (
  bookingId: string
): Promise<BookingTripRiderForOtpLean | null> =>
  Booking.findById(bookingId)
    .select("+deliveryOtp")
    .populate({ path: "tripId", select: "riderId status" })
    .lean()
    .exec() as Promise<BookingTripRiderForOtpLean | null>;

export const incrementPickupOtpAttempt = async (
  bookingId: string
): Promise<{ attempts: number } | null> => {
  const r = await Booking.findOneAndUpdate(
    { _id: bookingId, "otpAttempts.pickup": { $lt: PARCEL_OTP_MAX_ATTEMPTS } },
    { $inc: { "otpAttempts.pickup": 1 } },
    { new: true }
  )
    .select("otpAttempts.pickup")
    .lean()
    .exec();
  if (!r) return null;
  return { attempts: (r as { otpAttempts?: { pickup?: number } }).otpAttempts?.pickup ?? 0 };
};

export const incrementDeliveryOtpAttempt = async (
  bookingId: string
): Promise<{ attempts: number } | null> => {
  const r = await Booking.findOneAndUpdate(
    { _id: bookingId, "otpAttempts.delivery": { $lt: PARCEL_OTP_MAX_ATTEMPTS } },
    { $inc: { "otpAttempts.delivery": 1 } },
    { new: true }
  )
    .select("otpAttempts.delivery")
    .lean()
    .exec();
  if (!r) return null;
  return { attempts: (r as { otpAttempts?: { delivery?: number } }).otpAttempts?.delivery ?? 0 };
};

export const finalizePickupVerification = (
  bookingId: string
): Promise<BookingLean | null> =>
  Booking.findOneAndUpdate(
    {
      _id: bookingId,
      status: BOOKING_STATUS.CONFIRMED,
      $or: [
        { "otpVerification.pickupVerified": { $exists: false } },
        { "otpVerification.pickupVerified": false },
        { "otpVerification.pickupVerified": null },
      ],
    },
    {
      $set: {
        "otpVerification.pickupVerified": true,
        status: BOOKING_STATUS.PICKED_UP,
      },
    },
    { new: true }
  )
    .lean()
    .exec() as Promise<BookingLean | null>;

export const finalizeDeliveryVerification = (
  bookingId: string
): Promise<BookingLean | null> =>
  Booking.findOneAndUpdate(
    {
      _id: bookingId,
      status: BOOKING_STATUS.PICKED_UP,
      $or: [
        { "otpVerification.deliveryVerified": { $exists: false } },
        { "otpVerification.deliveryVerified": false },
        { "otpVerification.deliveryVerified": null },
      ],
    },
    {
      $set: {
        "otpVerification.deliveryVerified": true,
        status: BOOKING_STATUS.DELIVERED,
      },
    },
    { new: true }
  )
    .lean()
    .exec() as Promise<BookingLean | null>;

export type BookingWithTripRiderLean = Omit<BookingLean, "tripId"> & {
  tripId: { _id: mongoose.Types.ObjectId; riderId: mongoose.Types.ObjectId } | null;
};

export const findByIdWithTripRider = (
  bookingId: string
): Promise<BookingWithTripRiderLean | null> =>
  Booking.findById(bookingId)
    .populate({ path: "tripId", select: "riderId" })
    .lean()
    .exec() as Promise<BookingWithTripRiderLean | null>;

export const findByIdWithSender = (
  bookingId: string,
  senderId: string
): Promise<BookingLean | null> =>
  Booking.findOne({
    _id: bookingId,
    senderId: new mongoose.Types.ObjectId(senderId),
  })
    .lean()
    .exec() as Promise<BookingLean | null>;

export const updateStatus = (
  bookingId: string,
  status: string
): Promise<BookingLean | null> =>
  Booking.findByIdAndUpdate(
    bookingId,
    { $set: { status } },
    { new: true }
  )
    .lean()
    .exec() as Promise<BookingLean | null>;

export const findBySenderIdAndStatuses = (
  senderId: string,
  statuses: string[]
): Promise<BookingLean[]> =>
  Booking.find({
    senderId: new mongoose.Types.ObjectId(senderId),
    status: { $in: statuses },
  })
    .sort({ createdAt: -1 })
    .populate("tripId", "fromLocation toLocation travelDate departureTime arrivalTime riderId")
    .lean()
    .exec() as Promise<BookingLean[]>;

export type BookingRequestLean = BookingLean & {
  senderId?: { _id: mongoose.Types.ObjectId; name?: string; email?: string; phoneNumber?: string; countryCode?: string };
};

export const findByTripIdsAndStatuses = (
  tripIds: mongoose.Types.ObjectId[],
  statuses: string[]
): Promise<BookingRequestLean[]> =>
  Booking.find({
    tripId: { $in: tripIds },
    status: { $in: statuses },
  })
    .populate("senderId", "name email phoneNumber countryCode")
    .sort({ createdAt: -1 })
    .lean()
    .exec() as Promise<BookingRequestLean[]>;

/**
 * Atomic: confirm booking and deduct trip remaining capacity. Runs inside a transaction.
 */
export const atomicConfirmAndDeductCapacity = async (
  session: mongoose.mongo.ClientSession,
  bookingId: string,
  tripId: string,
  parcelWeight: number,
  transactionId: string
): Promise<void> => {
  const trip = await Trip.findOne({
    _id: tripId,
    status: TRIP_STATUS.PUBLISHED,
  })
    .session(session)
    .exec();

  if (!trip || !trip.remainingCapacity) {
    throw new Error("Trip not found or no remaining capacity");
  }

  const rem = trip.remainingCapacity;
  const newRemaining = {
    maxWeight: Math.max(0, rem.maxWeight - parcelWeight),
    maxLength: rem.maxLength,
    maxWidth: rem.maxWidth,
    maxHeight: rem.maxHeight,
  };

  if (newRemaining.maxWeight < 0) {
    throw new Error("Insufficient remaining capacity");
  }

  const [bookingResult] = await Promise.all([
    Booking.findOneAndUpdate(
      {
        _id: bookingId,
        status: BOOKING_STATUS.PENDING_PAYMENT,
      },
      {
        $set: {
          status: BOOKING_STATUS.CONFIRMED,
          paymentTransactionId: transactionId,
          escrowAmount: trip.price,
        },
      },
      { new: true }
    ).session(session),
    Trip.findByIdAndUpdate(
      tripId,
      { $set: { remainingCapacity: newRemaining } },
      { new: true }
    ).session(session),
  ]);

  if (!bookingResult) {
    throw new Error("Booking not found or already confirmed");
  }
}

export const cancelPendingBookingsForTrip = async (tripId: string): Promise<number> => {
  const pendingStatuses = [BOOKING_STATUS.PENDING_RIDER_ACCEPT, BOOKING_STATUS.PENDING_PAYMENT];
  const result = await Booking.updateMany(
    {
      tripId: new mongoose.Types.ObjectId(tripId),
      status: { $in: pendingStatuses },
    },
    {
      $set: { status: BOOKING_STATUS.CANCELLED },
    }
  ).exec();

  // Mongoose returns different shapes depending on version
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const modifiedCount = (result as any).modifiedCount as number | undefined;
  return typeof modifiedCount === "number" ? modifiedCount : 0;
};
