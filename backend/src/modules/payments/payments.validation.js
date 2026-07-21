const { z } = require("zod");

const createPaymentSchema = z.object({
  invoiceId: z.string().trim().optional().nullable().or(z.literal("")),
  invoiceNumber: z.string().trim().max(50).optional().default(""),
  animalId: z.string().trim().optional().nullable().or(z.literal("")),
  customerId: z.string().trim().optional().nullable().or(z.literal("")),
  ownerId: z.string().trim().optional().nullable().or(z.literal("")),
  amount: z.coerce.number().positive("Ödeme tutarı 0'dan büyük olmalıdır."),
  method: z.string().trim().max(50).optional().default("Nakit"),
  date: z.string().trim().min(1, "Tarih gerekli."),
  note: z.string().trim().max(1000).optional().default(""),
  receiptNumber: z.string().trim().optional(),
});

const updatePaymentSchema = createPaymentSchema.partial();

module.exports = { createPaymentSchema, updatePaymentSchema };
