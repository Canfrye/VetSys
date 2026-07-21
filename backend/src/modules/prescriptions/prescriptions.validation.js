const { z } = require("zod");

const prescriptionItemSchema = z.object({
  medicationName: z.string().trim().min(1, "İlaç adı gerekli."),
  dose: z.string().trim().max(100).optional().default(""),
  quantity: z.coerce.number().positive().optional().default(1),
  frequency: z.string().trim().max(100).optional().default(""),
  duration: z.string().trim().max(100).optional().default(""),
  instructions: z.string().trim().max(500).optional().default(""),
});

const createPrescriptionSchema = z.object({
  animalId: z.string().trim().optional().nullable().or(z.literal("")),
  customerId: z.string().trim().optional().nullable().or(z.literal("")),
  ownerId: z.string().trim().optional().nullable().or(z.literal("")),
  veterinarian: z.string().trim().max(100).optional().default(""),
  examinationId: z.string().trim().max(100).optional().default(""),
  examinationDate: z.string().trim().max(20).optional().default(""),
  date: z.string().trim().min(1, "Tarih gerekli."),
  diagnosis: z.string().trim().max(500).optional().default(""),
  notes: z.string().trim().max(2000).optional().default(""),
  items: z.array(prescriptionItemSchema).min(1, "En az bir ilaç kalemi gerekli."),
  prescriptionNumber: z.string().trim().optional(),
});

const updatePrescriptionSchema = createPrescriptionSchema.partial().extend({
  items: z.array(prescriptionItemSchema).min(1).optional(),
});

module.exports = { createPrescriptionSchema, updatePrescriptionSchema };
