import type { Request, Response } from "express";
import { asyncHandler } from "@/middlewares/asyncHandler";
import { sendSuccess } from "@/utils/responseFormatter";
import { createError } from "@/utils/appError";
import type { AuthRequest } from "@/middlewares/auth";
import {
  startVerificationSession,
  getVerificationStatusForUser,
  handleVeriffWebhook,
} from "@/modules/verification/verification.service";

export const startVerificationController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw createError("Unauthorized", 401);
    }
    const result = await startVerificationSession(req.user.userId);
    sendSuccess(res, { data: result });
  }
);

export const getVerificationStatusController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw createError("Unauthorized", 401);
    }
    const status = await getVerificationStatusForUser(req.user.userId);
    sendSuccess(res, { data: status });
  }
);

export const veriffWebhookController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    await handleVeriffWebhook(rawBody, req.headers, req.body);
    res.status(200).json({ received: true });
  }
);

/**
 * Browser redirect after Veriff session (GET). Veriff sends server webhooks via POST only.
 */
export const veriffCallbackReturnController = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Verification</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 28rem; margin: 3rem auto; padding: 0 1rem; line-height: 1.5; }
    h1 { font-size: 1.25rem; }
  </style>
</head>
<body>
  <h1>Verification finished</h1>
  <p>You can close this page and return to the RidePack app. Your status updates in a few moments.</p>
</body>
</html>`;
    res.status(200).type("html").send(html);
  }
);

