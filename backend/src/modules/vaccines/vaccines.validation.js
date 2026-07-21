const { z } = require("zod");

const createVaccineSchema = z.object({
  animalId: z.string().trim().min(1, "Hayvan seçimi gerekli."),
  customerId: z.string().trim().optional().nullable().or(z.literal("")),
  ownerId: z.string().trim().optional().nullable().or(z.literal("")),
  vaccineName: z.string().trim().min(1, "Aşı adı gerekli."),
  brand: z.string().trim().max(100).optional().default(""),
  batchNo: z.string().trim().max(50).optional().default(""),
  dose: z.string().trim().max(50).optional().default(""),
  applicationDate: z.string().trim().min(1, "Uygulama tarihi gerekli."),
  nextDoseDate: z.string().trim().max(20).optional().default(""),
  fee: z.coerce.number().min(0).optional().nullable(),
  veterinarian: z.string().trim().max(100).optional().default(""),
  notes: z.string().trim().max(1000).optional().default(""),
  status: z.string().trim().max(50).optional().default(""),
});

const updateVaccineSchema = createVaccineSchema.partial();

module.exports = { createVaccineSchema, updateVaccineSchema };
