import { createClient } from "redis";
import { logger } from "@/config/logger";

const REDIS_URL = process.env.REDIS_URL;
const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379", 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

// Create Redis client - use URL if provided, otherwise use host/port
export const redisClient = REDIS_URL
  ? createClient({
      url: REDIS_URL,
    })
  : createClient({
      socket: {
        host: REDIS_HOST,
        port: REDIS_PORT,
      },
      ...(REDIS_PASSWORD && { password: REDIS_PASSWORD }),
    });

redisClient.on("error", (err) => {
  logger.error(`Redis Client Error: ${err.message}`);
});

redisClient.on("connect", () => {
  logger.info("Redis Client Connecting...");
});

redisClient.on("ready", () => {
  logger.info("Redis Client Ready");
});

redisClient.on("reconnecting", () => {
  logger.warn("Redis Client Reconnecting...");
});

export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    logger.info("Redis connected successfully");
  } catch (error) {
    logger.error(`Redis connection error: ${error}`);
    process.exit(1);
  }
};

export const disconnectRedis = async (): Promise<void> => {
  try {
    await redisClient.quit();
    logger.info("Redis disconnected");
  } catch (error) {
    logger.error(`Error disconnecting Redis: ${error}`);
  }
};
