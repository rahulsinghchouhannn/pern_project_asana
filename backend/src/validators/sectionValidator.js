const { z } = require("zod");

const createSectionSchema = z.object({
  name: z.string().min(1).max(255).optional().default("Untitled section"),
});

const updateSectionSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  position: z.number().int().min(0).optional(),
});

const reorderSectionsSchema = z.object({
  sectionIds: z
    .array(z.string().uuid())
    .min(1, { message: "sectionIds must contain at least one UUID" }),
});

module.exports = {
  createSectionSchema,
  updateSectionSchema,
  reorderSectionsSchema,
};
