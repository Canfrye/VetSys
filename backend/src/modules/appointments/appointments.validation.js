const { z } = require("zod");

const createAppointmentSchema = z.object({
  animalId: z.string().trim().min(1, "Hayvan seçimi gerekli."),
  customerId: z.string().trim().optional().nullable().or(z.literal("")),
  ownerId: z.string().trim().optional().nullable().or(z.literal("")),
  date: z.string().trim().min(1, "Tarih gerekli."),
  time: z.string().trim().min(1, "Saat gerekli."),
  duration: z.coerce.number().int().positive().max(480).optional().default(30),
  veterinarian: z.string().trim().max(100).optional().default(""),
  reason: z.string().trim().max(255).optional().default(""),
  status: z.string().trim().max(30).optional().default("Bekliyor"),
  note: z.string().trim().max(1000).optional().default(""),
});

const updateAppointmentSchema = createAppointmentSchema.partial();

module.exports = { createAppointmentSchema, updateAppointmentSchema };
