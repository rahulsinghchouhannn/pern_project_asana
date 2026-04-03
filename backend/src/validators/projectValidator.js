const { z } = require("zod");

const hexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, { message: "Color must be a valid hex code (e.g. #6C63FF)" })
  .optional();

const viewEnum = z.enum(["overview", "list", "board", "timeline", "dashboard", "calendar"]);

const createProjectSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }).max(255),
  description: z.string().max(2000).optional(),
  color: hexColor,
  isPrivate: z.boolean().optional(),
  defaultView: viewEnum.optional(),
  views: z.array(viewEnum).min(1).optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  color: hexColor,
  isPrivate: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  isCompleted: z.boolean().optional(),
  defaultView: viewEnum.optional(),
  views: z.array(viewEnum).min(1).optional(),
});

const addMemberSchema = z.object({
  userId: z.string().uuid({ message: "userId must be a valid UUID" }),
  role: z.enum(["owner", "editor", "commenter", "member"]),
});

const createStatusSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }).max(100),
  color: hexColor,
  position: z.number().int().optional(),
});

const updateStatusSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: hexColor,
  position: z.number().int().optional(),
});

const idParamSchema = z.object({
  id: z.string().uuid({ message: "id must be a valid UUID" }),
});

const reorderStatusesSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1),
});

module.exports = {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
  createStatusSchema,
  updateStatusSchema,
  idParamSchema,
  reorderStatusesSchema,
};
