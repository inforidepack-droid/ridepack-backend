export const REVIEW_COMMENT_MAX = 500;
export const REVIEW_RATING_MIN = 1;
export const REVIEW_RATING_MAX = 5;
export const REVIEW_CATEGORY_KEYS = [
  "communication",
  "punctuality",
  "packageCare",
  "handoffExperience",
  "professionalism",
] as const;

export type ReviewCategoryKey = (typeof REVIEW_CATEGORY_KEYS)[number];
