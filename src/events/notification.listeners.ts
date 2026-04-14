import { logger } from "@/config/logger";
import { eventBus } from "@/events/eventBus";
import { NOTIFICATION_EVENT } from "@/modules/notifications/notification.events";
import type {
  BookingCreatedPayload,
  BookingIdPayload,
  ChatMessagePayload,
  DeliveryVerifiedPayload,
  PaymentSucceededPayload,
  RequestAcceptedPayload,
  WalletCreditedPayload,
} from "@/modules/notifications/notification.events";
import { sendPushToUser } from "@/modules/notifications/notification.push.service";
import { findUserIdByPhoneContact } from "@/modules/notifications/userByPhone.lookup";
import Booking from "@/modules/booking/booking.model";

const safe = async (label: string, fn: () => Promise<void>): Promise<void> => {
  try {
    await fn();
  } catch (e) {
    logger.error(`notification listener ${label}`, { err: e });
  }
};

export const registerNotificationListeners = (): void => {
  eventBus.on(NOTIFICATION_EVENT.BOOKING_CREATED, (p: BookingCreatedPayload) => {
    void safe("bookingCreated", async () => {
      await sendPushToUser(
        p.riderId,
        "New delivery request",
        "New parcel delivery request available.",
        "booking_created",
        { referenceId: p.bookingId }
      );
    });
  });

  eventBus.on(NOTIFICATION_EVENT.REQUEST_ACCEPTED, (p: RequestAcceptedPayload) => {
    void safe("requestAccepted", async () => {
      await sendPushToUser(
        p.senderId,
        "Request accepted",
        "Your booking request was accepted. Complete payment to confirm.",
        "request_accepted",
        { referenceId: p.bookingId }
      );
    });
  });

  eventBus.on(NOTIFICATION_EVENT.PICKUP_ARRIVED, (p: BookingIdPayload) => {
    void safe("pickupArrived", async () => {
      if (!p.senderId) return;
      await sendPushToUser(
        p.senderId,
        "Rider arrived",
        "Your rider has arrived. Please share your pickup OTP.",
        "pickup_arrived",
        { referenceId: p.bookingId }
      );
    });
  });

  eventBus.on(NOTIFICATION_EVENT.PICKUP_VERIFIED, (p: BookingIdPayload) => {
    void safe("pickupVerified", async () => {
      if (!p.senderId) return;
      await sendPushToUser(
        p.senderId,
        "Parcel picked up",
        "Your parcel has been picked up successfully.",
        "pickup_verified",
        { referenceId: p.bookingId }
      );
    });
  });

  eventBus.on(NOTIFICATION_EVENT.PARCEL_IN_TRANSIT, (p: BookingIdPayload) => {
    void safe("parcelInTransit", async () => {
      const booking = await Booking.findById(p.bookingId).select("receiverDetails").lean().exec();
      if (!booking) return;
      const rd = (booking as { receiverDetails?: { phone: string; countryCode?: string } }).receiverDetails;
      if (!rd?.phone) return;
      const receiverUserId = await findUserIdByPhoneContact({
        phone: rd.phone,
        countryCode: rd.countryCode,
      });
      if (!receiverUserId) return;
      await sendPushToUser(
        receiverUserId,
        "Parcel on the way",
        "Your parcel is in transit with the rider.",
        "parcel_in_transit",
        { referenceId: p.bookingId }
      );
    });
  });

  eventBus.on(NOTIFICATION_EVENT.DELIVERY_ARRIVED, (p: BookingIdPayload) => {
    void safe("deliveryArrived", async () => {
      const booking = await Booking.findById(p.bookingId).select("receiverDetails").lean().exec();
      if (!booking) return;
      const rd = (booking as { receiverDetails?: { phone: string; countryCode?: string } }).receiverDetails;
      if (!rd?.phone) return;
      const receiverUserId = await findUserIdByPhoneContact({
        phone: rd.phone,
        countryCode: rd.countryCode,
      });
      if (!receiverUserId) return;
      await sendPushToUser(
        receiverUserId,
        "Rider arrived",
        "Rider has arrived. Please share your delivery OTP.",
        "delivery_arrived",
        { referenceId: p.bookingId }
      );
    });
  });

  eventBus.on(NOTIFICATION_EVENT.DELIVERY_VERIFIED, (p: DeliveryVerifiedPayload) => {
    void safe("deliveryVerified", async () => {
      await sendPushToUser(
        p.senderId,
        "Delivered",
        "Your parcel has been delivered successfully.",
        "delivery_verified",
        { referenceId: p.bookingId }
      );
      if (p.receiverUserId) {
        await sendPushToUser(
          p.receiverUserId,
          "Delivered",
          "Your parcel has been delivered successfully.",
          "delivery_verified",
          { referenceId: p.bookingId }
        );
      }
    });
  });

  eventBus.on(NOTIFICATION_EVENT.WALLET_CREDITED, (p: WalletCreditedPayload) => {
    void safe("walletCredited", async () => {
      await sendPushToUser(
        p.riderId,
        "Wallet credited",
        `Your wallet was credited $${p.amount.toFixed(2)} for a delivery.`,
        "wallet_credited",
        { referenceId: p.bookingId }
      );
    });
  });

  eventBus.on(NOTIFICATION_EVENT.PAYMENT_SUCCEEDED, (p: PaymentSucceededPayload) => {
    void safe("paymentSucceeded", async () => {
      await sendPushToUser(
        p.senderId,
        "Payment successful",
        "Your booking payment was confirmed.",
        "payment_succeeded",
        { referenceId: p.bookingId }
      );
    });
  });

  eventBus.on(NOTIFICATION_EVENT.CHAT_MESSAGE_RECEIVED, (p: ChatMessagePayload) => {
    void safe("chatMessageReceived", async () => {
      await sendPushToUser(
        p.recipientUserId,
        "New message",
        p.preview.length > 80 ? `${p.preview.slice(0, 77)}...` : p.preview,
        "chat_message",
        { referenceId: p.bookingId }
      );
    });
  });
};
