import { randomInt } from "node:crypto";

export const generateOtp = (): string => randomInt(1000, 10_000).toString();
