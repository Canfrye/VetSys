const { z } = require("zod");

const createAnimalSchema = z.object({
  name: z.string().trim().min(1).max(50),
  species: z.string().trim().min(1).max(50),
  breed: z.string().trim().max(50).optional().default(""),
  gender: z.string().trim().max(20).optional().default(""),
  birthDate: z.coerce.date().optional().nullable().or(z.literal("")),
  color: z.string().trim().max(50).optional().default(""),
  microchipNo: z.string().trim().max(50).optional().or(z.literal("")).default(""),
  weight: z.union([z.string(), z.number()]).optional().nullable().transform((v) =>
    v == null || v === "" ? "" : String(v)
  ),
  passportNo: z.string().trim().max(50).optional().default(""),
  neutered: z.boolean().optional().default(false),
  active: z.boolean().optional().default(true),
  note: z.string().trim().max(2000).optional().default(""),
  ownerType: z.string().trim().max(30).optional().default("customer"),
  otherOwnerName: z.string().trim().max(200).optional().default(""),
  customerId: z.string().trim().optional().nullable().or(z.literal("")),
  ownerId: z.string().trim().optional().nullable().or(z.literal("")),
});

const updateAnimalSchema = createAnimalSchema.partial();

module.exports = { createAnimalSchema, updateAnimalSchema };
