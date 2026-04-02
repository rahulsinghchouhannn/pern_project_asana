const { z } = require("zod");
const { ALL_PERMISSIONS } = require("../config/permissions");

const createRoleSchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.array(z.enum(ALL_PERMISSIONS)).default([]),
});

const updateRoleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  permissions: z.array(z.enum(ALL_PERMISSIONS)).optional(),
});

const assignRoleSchema = z.object({
  roleId: z.string().uuid(),
});

module.exports = { createRoleSchema, updateRoleSchema, assignRoleSchema };
