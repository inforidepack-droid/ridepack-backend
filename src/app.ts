import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { apiLimiter } from "@/middlewares/rateLimiter";
import routes from "./routes/routes";
import { errorHandler } from "@/middlewares/errorHandler";
import passport from "passport";

export const createApp = (): Express => {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || "http://localhost:3000",
      credentials: true,
    })
  );

  // Body parser
  app.use(express.json());
  app.use(passport.initialize());
  app.use(express.urlencoded({ extended: true }));

  // Rate limiting
  app.use("/api", apiLimiter);

  // Routes
  app.use("/api", routes);

  // Health check endpoint
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
};
