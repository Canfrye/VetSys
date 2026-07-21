const { z } = require("zod");
const { ALL_ROLES } = require("../../config/roles");

const createUserSchema = z.object({
  username: z.string().trim().min(3).max(50),
  password: z.string().min(6).max(100),
  fullName: z.string().trim().min(2).max(100),
  role: z.enum(ALL_ROLES).default("RECEPTION"),
  active: z.boolean().default(true),
});

const updateUserSchema = z.object({
  username: z.string().trim().min(3).max(50).optional(),
  password: z.string().min(6).max(100).optional(),
  fullName: z.string().trim().min(2).max(100).optional(),
  role: z.enum(ALL_ROLES).optional(),
  active: z.boolean().optional(),
});

module.exports = { createUserSchema, updateUserSchema };
