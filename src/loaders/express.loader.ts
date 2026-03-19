import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { apiLimiter } from "@/middlewares/rateLimiter";
import { errorHandler } from "@/middlewares/errorHandler";
import routes from "@/routes/index";
import { env } from "@/config/env.config";
import morgan from "morgan";

export const loadExpress = (): Express => {
  const app = express();

 app.use(morgan("dev"))
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );

  app.use(
    express.json({
      verify: (req, _res, buf) => {
        (req as express.Request & { rawBody?: Buffer }).rawBody = Buffer.from(buf);
      },
    })
  );
  app.use(express.urlencoded({ extended: true }));

  // app.use("/api", apiLimiter);
  app.use("/api", routes);

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use(errorHandler);

  return app;
};
