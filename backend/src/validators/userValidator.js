const { z } = require("zod");

const updateProfileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }).max(100).optional(),
  email: z.string().email({ message: "Invalid email address" }).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required" }),
  newPassword: z
    .string()
    .min(8, { message: "New password must be at least 8 characters" }),
});

module.exports = { updateProfileSchema, changePasswordSchema };
