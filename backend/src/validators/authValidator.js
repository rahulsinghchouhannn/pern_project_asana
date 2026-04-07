const { z } = require("zod");

const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }).max(100),
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(100),
});

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

const magicLinkRequestSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

const magicLinkVerifySchema = z.object({
  token: z.string().min(1, { message: "Token is required" }),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, { message: "Refresh token is required" }),
});

const checkEmailSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

module.exports = {
  registerSchema,
  loginSchema,
  magicLinkRequestSchema,
  magicLinkVerifySchema,
  refreshTokenSchema,
  checkEmailSchema,
};
