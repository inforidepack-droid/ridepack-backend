import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import { logger } from "@/config/logger";
import { verifyToken } from "@/libs/jwt";

export interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export const initializeSocket = (httpServer: HttpServer): SocketServer => {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token =
        socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];

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

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });

    socket.on("error", (error) => {
      logger.error(`Socket error: ${error.message}`);
    });
  });

  return io;
};
