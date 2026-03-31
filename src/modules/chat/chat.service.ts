import mongoose from "mongoose";
import Booking from "@/modules/booking/booking.model";
import Trip from "@/modules/trip/trip.model";
import Conversation from "@/modules/chat/conversation.model";
import Message from "@/modules/chat/message.model";
import User from "@/modules/auth/models/User.model";
import { createError } from "@/utils/appError";
import { HTTP_STATUS } from "@/constants/http.constants";
import type { ConversationLean, MessageLean } from "@/modules/chat/chat.types";

const MAX_MESSAGE_LENGTH = 500;
const DUPLICATE_WINDOW_MS = 5000;

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const validateObjectId = (id: string, fieldName: string): void => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createError(`Invalid ${fieldName}`, HTTP_STATUS.BAD_REQUEST);
  }
};

const getActiveUser = async (userId: string) => {
  const user = await User.findById(userId).select("_id isBlocked").lean().exec();
  if (!user) throw createError("User not found", HTTP_STATUS.NOT_FOUND);
  if ((user as { isBlocked?: boolean }).isBlocked) {
    throw createError("Blocked users cannot access chat", HTTP_STATUS.FORBIDDEN);
  }
  return user;
};

const getBookingParticipants = async (bookingId: string) => {
  const booking = await Booking.findById(bookingId).select("_id senderId tripId").lean().exec();
  if (!booking) throw createError("Booking not found", HTTP_STATUS.NOT_FOUND);

  const trip = await Trip.findById(booking.tripId).select("_id riderId").lean().exec();
  if (!trip) throw createError("Trip not found for booking", HTTP_STATUS.NOT_FOUND);

  return {
    bookingId: booking._id.toString(),
    senderId: (booking.senderId as mongoose.Types.ObjectId).toString(),
    riderId: (trip.riderId as mongoose.Types.ObjectId).toString(),
  };
};

const assertBookingChatAccess = async (bookingId: string, userId: string) => {
  validateObjectId(bookingId, "bookingId");
  await getActiveUser(userId);
  const participants = await getBookingParticipants(bookingId);
  const isAllowed = participants.senderId === userId || participants.riderId === userId;
  if (!isAllowed) throw createError("Forbidden: not part of this booking chat", HTTP_STATUS.FORBIDDEN);
  return participants;
};

const findOrCreateConversation = async (bookingId: string, senderId: string, riderId: string) => {
  const existing = await Conversation.findOne({ bookingId }).lean().exec();
  if (existing) return existing as ConversationLean;

  const created = await Conversation.create({
    bookingId: new mongoose.Types.ObjectId(bookingId),
    senderId: new mongoose.Types.ObjectId(senderId),
    riderId: new mongoose.Types.ObjectId(riderId),
    lastMessage: "",
    lastMessageAt: new Date(),
  });
  return created.toObject() as ConversationLean;
};

const sanitizeMessage = (input: string): string => {
  const trimmed = input.trim();
  if (!trimmed) throw createError("Message cannot be empty", HTTP_STATUS.BAD_REQUEST);
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    throw createError(`Message exceeds ${MAX_MESSAGE_LENGTH} characters`, HTTP_STATUS.BAD_REQUEST);
  }
  return escapeHtml(trimmed);
};

export const ensureRoomAccess = async (bookingId: string, userId: string): Promise<void> => {
  await assertBookingChatAccess(bookingId, userId);
};

export const getConversationMessages = async (bookingId: string, userId: string): Promise<MessageLean[]> => {
  const participants = await assertBookingChatAccess(bookingId, userId);
  const conversation = await Conversation.findOne({ bookingId: participants.bookingId }).lean().exec();
  if (!conversation) return [];

  return (await Message.find({ conversationId: (conversation as ConversationLean)._id })
    .sort({ createdAt: 1 })
    .lean()
    .exec()) as MessageLean[];
};

export const sendMessageForBooking = async (
  bookingId: string,
  senderUserId: string,
  messageInput: string
): Promise<{ roomId: string; message: MessageLean }> => {
  const participants = await assertBookingChatAccess(bookingId, senderUserId);
  const conversation = await findOrCreateConversation(
    participants.bookingId,
    participants.senderId,
    participants.riderId
  );
  const cleanMessage = sanitizeMessage(messageInput);

  const duplicateSince = new Date(Date.now() - DUPLICATE_WINDOW_MS);
  const duplicate = await Message.findOne({
    conversationId: conversation._id,
    senderId: new mongoose.Types.ObjectId(senderUserId),
    message: cleanMessage,
    createdAt: { $gte: duplicateSince },
  })
    .lean()
    .exec();
  if (duplicate) {
    return { roomId: participants.bookingId, message: duplicate as MessageLean };
  }

  const created = await Message.create({
    conversationId: conversation._id,
    senderId: new mongoose.Types.ObjectId(senderUserId),
    message: cleanMessage,
    type: "text",
    isRead: false,
  });

  const message = created.toObject() as MessageLean;
  await Conversation.findByIdAndUpdate(conversation._id, {
    $set: {
      lastMessage: cleanMessage,
      lastMessageAt: message.createdAt,
      senderId: new mongoose.Types.ObjectId(participants.senderId),
      riderId: new mongoose.Types.ObjectId(participants.riderId),
    },
  }).exec();

  return { roomId: participants.bookingId, message };
};

export const listUserConversations = async (userId: string): Promise<ConversationLean[]> => {
  await getActiveUser(userId);
  return (await Conversation.find({
    $or: [
      { senderId: new mongoose.Types.ObjectId(userId) },
      { riderId: new mongoose.Types.ObjectId(userId) },
    ],
  })
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .lean()
    .exec()) as ConversationLean[];
};
