const { z } = require("zod");

const createCustomerSchema = z.object({
  ad: z.string().trim().min(2).max(50),
  soyad: z.string().trim().min(2).max(50),
  telefon: z.string().trim().max(20).optional().default(""),
  email: z.string().trim().email().optional().or(z.literal("")).default(""),
  tcKimlik: z.string().trim().max(11).optional().default(""),
  adres: z.string().trim().max(255).optional().default(""),
  not: z.string().trim().max(1000).optional().default(""),
});

const updateCustomerSchema = createCustomerSchema.partial();

module.exports = { createCustomerSchema, updateCustomerSchema };
