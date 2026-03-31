import type { Socket } from "socket.io";
import { logger } from "@/config/logger";
import * as chatService from "@/modules/chat/chat.service";

interface SocketWithUser extends Socket {
  userId?: string;
}

const asString = (value: unknown): string => (typeof value === "string" ? value : "");

export const registerChatSocketHandlers = (socket: SocketWithUser): void => {
  socket.on("join_room", async (payload: { bookingId?: string }) => {
    try {
      if (!socket.userId) throw new Error("Unauthorized socket user");
      const bookingId = asString(payload?.bookingId);
      await chatService.ensureRoomAccess(bookingId, socket.userId);
      socket.join(bookingId);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "join_room failed";
      socket.emit("chat_error", { message: msg });
      logger.warn(`join_room failed for socket ${socket.id}: ${msg}`);
    }
  });

  socket.on("send_message", async (payload: { bookingId?: string; message?: string }) => {
    try {
      if (!socket.userId) throw new Error("Unauthorized socket user");
      const bookingId = asString(payload?.bookingId);
      const message = asString(payload?.message);
      const result = await chatService.sendMessageForBooking(bookingId, socket.userId, message);

      socket.to(result.roomId).emit("receive_message", result.message);
      socket.emit("message_sent", result.message);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "send_message failed";
      socket.emit("chat_error", { message: msg });
      logger.warn(`send_message failed for socket ${socket.id}: ${msg}`);
    }
  });
};
