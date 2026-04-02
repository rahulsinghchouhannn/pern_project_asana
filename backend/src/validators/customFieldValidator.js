const { z } = require("zod");

const fieldTypeEnum = z.enum(["text", "number", "dropdown", "date", "user"]);

const optionSchema = z.object({
  value: z.string().min(1).max(255),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, { message: "Color must be a valid hex code" })
    .optional(),
});

const createFieldSchema = z.object({
  name: z.string().min(1).max(100),
  type: fieldTypeEnum,
  options: z.array(optionSchema).optional(),
  position: z.number().int().min(0).optional(),
  isRequired: z.boolean().optional(),
});

const updateFieldSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: fieldTypeEnum.optional(),
  options: z.array(optionSchema).optional(),
  position: z.number().int().min(0).optional(),
  isRequired: z.boolean().optional(),
});

const reorderFieldsSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1),
});

const setValueSchema = z.object({
  valueText: z.string().max(10000).optional().nullable(),
  valueNumber: z.number().optional().nullable(),
  valueDate: z.string().datetime({ offset: true }).optional().nullable(),
  valueUserId: z.string().uuid().optional().nullable(),
  valueOption: z.string().max(255).optional().nullable(),
});

module.exports = {
  createFieldSchema,
  updateFieldSchema,
  reorderFieldsSchema,
  setValueSchema,
};
