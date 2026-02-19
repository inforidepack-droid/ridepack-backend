import type { Express } from "express";
import { loadExpress } from "@/loaders/express.loader";

export const createApp = (): Express => loadExpress();
