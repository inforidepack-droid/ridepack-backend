import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { apiLimiter } from "@/middlewares/rateLimiter";
import { errorHandler } from "@/middlewares/errorHandler";
import routes from "@/routes/index";
import { env } from "@/config/env.config";

export const loadExpress = (): Express => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // app.use("/api", apiLimiter);
  app.use("/api", routes);

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use(errorHandler);

  return app;
};
