const { z } = require("zod");

const createOrgSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Organization name must be at least 2 characters" })
    .max(100),
});

const inviteUserSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

const acceptInviteSchema = z.object({
  token: z.string().min(1, { message: "Invitation token is required" }),
});

module.exports = { createOrgSchema, inviteUserSchema, acceptInviteSchema };
