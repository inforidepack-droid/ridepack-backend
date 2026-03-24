import mongoose from "mongoose";
import Booking, { IBooking } from "@/modules/booking/booking.model";
import Trip from "@/modules/trip/trip.model";
import { BOOKING_STATUS } from "@/modules/booking/booking.constants";
import { TRIP_STATUS } from "@/modules/trip/trip.constants";

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
