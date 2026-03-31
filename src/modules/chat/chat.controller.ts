import type { Response } from "express";
import { asyncHandler } from "@/middlewares/asyncHandler";
import { sendCreated, sendSuccess } from "@/utils/responseFormatter";
import { createError } from "@/utils/appError";
import { HTTP_STATUS } from "@/constants/http.constants";
import type { AuthRequest } from "@/middlewares/auth";
import * as chatService from "@/modules/chat/chat.service";
import { getSocketServer } from "@/config/socket";

export const getBookingChatController = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw createError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  const bookingId = req.params.bookingId as string;
  const messages = await chatService.getConversationMessages(bookingId, req.user.userId);
  sendSuccess(res, { data: { messages } });
});

export const sendChatMessageController = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw createError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  const bookingId = String(req.body.bookingId || "");
  const messageText = String(req.body.message || "");

  const result = await chatService.sendMessageForBooking(bookingId, req.user.userId, messageText);
  const io = getSocketServer();
  if (io) {
    io.to(result.roomId).emit("receive_message", result.message);
  }

  sendCreated(res, { data: { message: result.message } });
});

export const listConversationsController = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw createError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  const conversations = await chatService.listUserConversations(req.user.userId);
  sendSuccess(res, { data: { conversations } });
});
