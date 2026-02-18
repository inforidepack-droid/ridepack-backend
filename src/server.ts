import "dotenv/config"
import "@/config/passport";
import { createServer } from "http";
import { createApp } from "@/app";
import { connectDB, disconnectDB } from "@/config/db";
import { connectRedis, disconnectRedis } from "@/config/redis";
import { initializeSocket } from "@/config/socket";
import { logger } from "@/config/logger";
import "@/modules/auth/models/User.model";
import "@/modules/auth/models/Otp.model";

const PORT = process.env.PORT || 3000;

const startServer = async (): Promise<void> => {
  try {
    // Connect to databases
    await connectDB();
    await connectRedis();

    // Create Express app
    const app = createApp();

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize Socket.io
    initializeSocket(httpServer);

    // Start server
    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (): Promise<void> => {
      logger.info("Shutting down gracefully...");
      httpServer.close(async () => {
        logger.info("HTTP server closed");
        await disconnectDB();
        await disconnectRedis();
        process.exit(0);
      });
    };

    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);
  } catch (error) {
    logger.error(`Failed to start server: ${error}`);
    process.exit(1);
  }
};

startServer();
