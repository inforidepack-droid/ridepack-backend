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

export const emitBookingCreated = (payload: BookingCreatedPayload): void => {
  eventBus.emit(NOTIFICATION_EVENT.BOOKING_CREATED, payload);
};

export const emitRequestAccepted = (payload: RequestAcceptedPayload): void => {
  eventBus.emit(NOTIFICATION_EVENT.REQUEST_ACCEPTED, payload);
};

export const emitPickupArrived = (payload: BookingIdPayload): void => {
  eventBus.emit(NOTIFICATION_EVENT.PICKUP_ARRIVED, payload);
};

export const emitPickupVerified = (payload: BookingIdPayload): void => {
  eventBus.emit(NOTIFICATION_EVENT.PICKUP_VERIFIED, payload);
};

export const emitParcelInTransit = (payload: BookingIdPayload): void => {
  eventBus.emit(NOTIFICATION_EVENT.PARCEL_IN_TRANSIT, payload);
};

export const emitDeliveryArrived = (payload: BookingIdPayload): void => {
  eventBus.emit(NOTIFICATION_EVENT.DELIVERY_ARRIVED, payload);
};

export const emitDeliveryVerified = (payload: DeliveryVerifiedPayload): void => {
  eventBus.emit(NOTIFICATION_EVENT.DELIVERY_VERIFIED, payload);
};

export const emitWalletCredited = (payload: WalletCreditedPayload): void => {
  eventBus.emit(NOTIFICATION_EVENT.WALLET_CREDITED, payload);
};

export const emitPaymentSucceeded = (payload: PaymentSucceededPayload): void => {
  eventBus.emit(NOTIFICATION_EVENT.PAYMENT_SUCCEEDED, payload);
};

export const emitChatMessageReceived = (payload: ChatMessagePayload): void => {
  eventBus.emit(NOTIFICATION_EVENT.CHAT_MESSAGE_RECEIVED, payload);
};
