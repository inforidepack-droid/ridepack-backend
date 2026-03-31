import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import { env } from "@/config/env.config";
import { getAllowedOrigins } from "@/config/cors.utils";
import { logger } from "@/config/logger";
import { verifyToken } from "@/libs/jwt";
import { registerChatSocketHandlers } from "@/modules/chat/chat.socket";

export interface AuthenticatedSocket extends Socket {
  userId?: string;
}

let socketServer: SocketServer | null = null;

export const getSocketServer = (): SocketServer | null => socketServer;

export const initializeSocket = (httpServer: HttpServer): SocketServer | null => {
  if (!env.ENABLE_SOCKET) {
    logger.info("Socket disabled");
    socketServer = null;
    return null;
  }

  const io = new SocketServer(httpServer, {
    cors: {
      origin: getAllowedOrigins(),
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = verifyToken(token);
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      logger.error(`Socket authentication error: ${error}`);
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    logger.info(`Socket connected: ${socket.id} (User: ${socket.userId})`);

    registerChatSocketHandlers(socket);

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });

    socket.on("error", (error) => {
      logger.error(`Socket error: ${error.message}`);
    });
  });

  socketServer = io;
  return io;
};
