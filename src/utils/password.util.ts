import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export const hashPassword = (plainPassword: string): Promise<string> =>
  bcrypt.hash(plainPassword, SALT_ROUNDS);

export const comparePassword = (plainPassword: string, hashedPassword: string): Promise<boolean> =>
  bcrypt.compare(plainPassword, hashedPassword);
