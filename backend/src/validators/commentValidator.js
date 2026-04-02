const { z } = require("zod");

const createCommentSchema = z.object({
  content: z.string().min(1).max(10000),
});

const updateCommentSchema = z.object({
  content: z.string().min(1).max(10000),
});

module.exports = { createCommentSchema, updateCommentSchema };
