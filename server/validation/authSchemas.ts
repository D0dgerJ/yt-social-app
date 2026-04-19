import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username is too long"),
  email: z
    .string()
    .trim()
    .email("Invalid email format")
    .max(255, "Email is too long"),
  password: z
    .string()
    .min(4, "Password must be at least 4 characters")
    .max(128, "Password is too long"),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email")
    .max(255, "Email is too long"),
  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password is too long"),
});