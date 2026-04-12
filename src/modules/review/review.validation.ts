import { z } from "zod";
import { REVIEW_COMMENT_MAX, REVIEW_CATEGORY_KEYS } from "@/modules/review/review.constants";
import { isValidObjectId } from "@/modules/review/review.utils";

const ratingValue = z.coerce
  .number()
  .int({ message: "Each rating must be a whole number" })
  .min(1, { message: "Each rating must be at least 1" })
  .max(5, { message: "Each rating must be at most 5" });

const ratingsObject = REVIEW_CATEGORY_KEYS.reduce(
  (acc, key) => ({ ...acc, [key]: ratingValue }),
  {} as Record<(typeof REVIEW_CATEGORY_KEYS)[number], typeof ratingValue>
);

export const createReviewBodySchema = z.object({
  bookingId: z
    .string()
    .min(1, "bookingId is required")
    .refine((id) => isValidObjectId(id), { message: "Invalid bookingId format" }),
  ratings: z.object(ratingsObject).strict(),
  comment: z.string().max(REVIEW_COMMENT_MAX, `Comment must be at most ${REVIEW_COMMENT_MAX} characters`).optional(),
});

export const listReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;
