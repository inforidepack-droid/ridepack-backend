import { env } from "@/config/env.config";

const parseCommaSeparated = (raw: string): string[] =>
  raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const devDefaultOrigins = (): string[] => [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "http://127.0.0.1:3000",
];

/**
 * Origins allowed for browser CORS (API + Socket.io).
 * In development, common Vite ports are included so the SPA can call the API.
 */
export const getAllowedOrigins = (): string[] => {
  const configured = parseCommaSeparated(env.CORS_ORIGIN);
  if (env.NODE_ENV === "production") {
    return configured.length > 0 ? configured : ["http://localhost:3000"];
  }
  return [...new Set([...devDefaultOrigins(), ...configured])];
};

/**
 * Base URL for Stripe Connect return/refresh (user lands on the frontend app).
 */
export const getStripeOnboardingBaseUrl = (): string => {
  const allowed = getAllowedOrigins();
  const frontend =
    allowed.find((o) => o.includes(":5173") || o.includes(":4173")) ||
    allowed.find((o) => o.includes("localhost"));
  return frontend || allowed[0] || "http://localhost:5173";
};
