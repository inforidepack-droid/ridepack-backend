/** Domain events for push + inbox (EventEmitter channel names). */
export const NOTIFICATION_EVENT = {
  BOOKING_CREATED: "bookingCreated",
  REQUEST_ACCEPTED: "requestAccepted",
  PICKUP_ARRIVED: "pickupArrived",
  PICKUP_VERIFIED: "pickupVerified",
  PARCEL_IN_TRANSIT: "parcelInTransit",
  DELIVERY_ARRIVED: "deliveryArrived",
  DELIVERY_VERIFIED: "deliveryVerified",
  WALLET_CREDITED: "walletCredited",
  PAYMENT_SUCCEEDED: "paymentSucceeded",
  CHAT_MESSAGE_RECEIVED: "chatMessageReceived",
} as const;

export type BookingCreatedPayload = { riderId: string; bookingId: string };
export type RequestAcceptedPayload = { senderId: string; bookingId: string };
export type BookingIdPayload = { bookingId: string; senderId?: string; riderId?: string };
export type DeliveryVerifiedPayload = {
  bookingId: string;
  senderId: string;
  receiverUserId: string | null;
};
export type WalletCreditedPayload = { riderId: string; bookingId: string; amount: number };
export type PaymentSucceededPayload = { senderId: string; bookingId: string };
export type ChatMessagePayload = {
  bookingId: string;
  recipientUserId: string;
  preview: string;
};
