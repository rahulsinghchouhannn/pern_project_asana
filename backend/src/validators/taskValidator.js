const { z } = require("zod");

const priorityEnum = z.enum(["none", "low", "medium", "high", "urgent"]).optional();

const tagSchema = z.object({
  name: z.string().min(1).max(100),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, { message: "Color must be a valid hex code" })
    .optional(),
});

const createTaskSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }).max(500),
  description: z.string().max(10000).optional(),
  statusId: z.string().uuid({ message: "statusId must be a valid UUID" }),
  sectionId: z.string().uuid().optional().nullable(),
  taskType: z.enum(["task", "milestone"]).optional(),
  priority: priorityEnum,
  startDate: z.string().datetime({ offset: true }).optional().or(z.literal("")).transform((v) => v || undefined),
  dueDate: z.string().datetime({ offset: true }).optional().or(z.literal("")).transform((v) => v || undefined),
  assigneeIds: z.array(z.string().uuid()).optional(),
  tags: z.array(tagSchema).optional(),
  parentTaskId: z.string().uuid().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(10000).optional().nullable(),
  statusId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional().nullable(),
  taskType: z.enum(["task", "milestone"]).optional(),
  priority: priorityEnum,
  startDate: z.string().datetime({ offset: true }).optional().nullable(),
  dueDate: z.string().datetime({ offset: true }).optional().nullable(),
  position: z.number().int().min(0).optional(),
});

const assigneeSchema = z.object({
  userId: z.string().uuid({ message: "userId must be a valid UUID" }),
});

const taskFilterSchema = z.object({
  statusId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
  priority: z.enum(["none", "low", "medium", "high", "urgent"]).optional(),
  isCompleted: z
    .string()
    .optional()
    .transform((v) => {
      if (v === "true") return true;
      if (v === "false") return false;
      return undefined;
    }),
  search: z.string().max(255).optional(),
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1))
    .pipe(z.number().int().min(1).default(1)),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 50))
    .pipe(z.number().int().min(1).max(500).default(50)),
});

const updatePositionSchema = z.object({
  statusId: z.string().uuid({ message: "statusId must be a valid UUID" }),
  position: z.number().int().min(0),
});

const bulkUpdatePositionsSchema = z.object({
  updates: z
    .array(
      z.object({
        taskId: z.string().uuid(),
        statusId: z.string().uuid(),
        position: z.number().int().min(0),
        sectionId: z.string().uuid().optional().nullable(),
      })
    )
    .min(1),
});

const calendarQuerySchema = z.object({
  year: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(2000).max(2100)),
  month: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(1).max(12)),
});

const updateDatesSchema = z.object({
  startDate: z.string().datetime({ offset: true }).optional().nullable(),
  dueDate: z.string().datetime({ offset: true }).optional().nullable(),
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  assigneeSchema,
  taskFilterSchema,
  updatePositionSchema,
  bulkUpdatePositionsSchema,
  calendarQuerySchema,
  updateDatesSchema,
};
