import { z } from "zod";
import {
  REQUEST_LIST_DEFAULT_LIMIT,
  REQUEST_LIST_DEFAULT_PAGE,
  REQUEST_LIST_MAX_LIMIT,
  REQUEST_QUERY_STATUS,
} from "@/modules/request/request.constants";

const statusValues = [
  REQUEST_QUERY_STATUS.PENDING,
  REQUEST_QUERY_STATUS.ACCEPTED,
  REQUEST_QUERY_STATUS.REJECTED,
  REQUEST_QUERY_STATUS.CANCELLED,
] as const;

export const listMyRequestsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(REQUEST_LIST_DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(REQUEST_LIST_MAX_LIMIT)
    .default(REQUEST_LIST_DEFAULT_LIMIT),
  status: z.enum(statusValues).optional(),
  sort: z.enum(["asc", "desc"]).default("desc"),
});

export type ListMyRequestsQueryInput = z.infer<typeof listMyRequestsQuerySchema>;
