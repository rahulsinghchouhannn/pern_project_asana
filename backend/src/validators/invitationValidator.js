const { z } = require("zod");

const inviteToProjectSchema = z.object({
  email: z.string().email({ message: "A valid email address is required" }),
});

module.exports = { inviteToProjectSchema };
