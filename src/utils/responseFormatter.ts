import { Response } from "express";
import { HTTP_STATUS } from "@/constants/http.constants";
import { API_STATUS } from "@/constants/status.constants";

type SuccessPayload<T = unknown> = { data?: T; message?: string };
type FailPayload = { message: string; errors?: unknown };

export const sendSuccess = <T>(
  res: Response,
  payload: SuccessPayload<T>,
  statusCode: number = HTTP_STATUS.OK
): void => {
  res.status(statusCode).json({
    success: true,
    status: API_STATUS.SUCCESS,
    ...payload,
  });
};

export const sendCreated = <T>(res: Response, payload: SuccessPayload<T>): void => {
  sendSuccess(res, payload, HTTP_STATUS.CREATED);
};

export const sendFail = (
  res: Response,
  payload: FailPayload,
  statusCode: number = HTTP_STATUS.BAD_REQUEST
): void => {
  res.status(statusCode).json({
    success: false,
    status: API_STATUS.FAIL,
    ...payload,
  });
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  stack?: string
): void => {
  res.status(statusCode).json({
    success: false,
    status: API_STATUS.ERROR,
    error: { message, ...(stack && { stack }) },
  });
};
