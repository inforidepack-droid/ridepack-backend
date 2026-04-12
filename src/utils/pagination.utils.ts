/** Total pages for a page/limit UI; 0 total → 0 pages. */
export const computeTotalPages = (total: number, limit: number): number => {
  if (total <= 0 || limit <= 0) return 0;
  return Math.ceil(total / limit);
};

export const computeSkip = (page: number, limit: number): number => Math.max(0, (page - 1) * limit);
