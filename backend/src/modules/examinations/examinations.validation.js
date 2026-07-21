const { z } = require("zod");

const createExaminationSchema = z.object({
  animalId: z.string().trim().min(1, "Hayvan seçimi gerekli."),
  customerId: z.string().trim().optional().nullable().or(z.literal("")),
  ownerId: z.string().trim().optional().nullable().or(z.literal("")),
  species: z.string().trim().max(50).optional().default(""),
  veterinarian: z.string().trim().max(100).optional().default(""),
  examinationDate: z.string().trim().min(1, "Muayene tarihi gerekli."),
  examType: z.string().trim().max(100).optional().default(""),
  fee: z.coerce.number().min(0).optional().nullable(),
  complaint: z.string().trim().max(1000).optional().default(""),
  generalCondition: z.string().trim().max(255).optional().default(""),
  diagnosis: z.string().trim().max(500).optional().default(""),
  findings: z.string().trim().max(1000).optional().default(""),
  treatment: z.string().trim().max(1000).optional().default(""),
  temperature: z.string().trim().max(20).optional().default(""),
  pulse: z.string().trim().max(20).optional().default(""),
  respiration: z.string().trim().max(20).optional().default(""),
  height: z.string().trim().max(20).optional().default(""),
  weight: z.union([z.string(), z.number()]).optional().nullable().transform((v) =>
    v == null || v === "" ? "" : String(v)
  ),
  medicines: z.string().trim().max(1000).optional().default(""),
  procedures: z.string().trim().max(1000).optional().default(""),
  labResult: z.string().trim().max(1000).optional().default(""),
  controlDate: z.string().trim().max(20).optional().default(""),
  notes: z.string().trim().max(1000).optional().default(""),
  attachments: z.any().optional().nullable(),
});

const updateExaminationSchema = createExaminationSchema.partial();

module.exports = { createExaminationSchema, updateExaminationSchema };
