const { z } = require("zod");

const invoiceItemSchema = z.object({
  type: z.string().trim().min(1),
  description: z.string().trim().max(255).optional().default(""),
  unitPrice: z.coerce.number().min(0),
  quantity: z.coerce.number().positive(),
  purchasePrice: z.coerce.number().min(0).optional().default(0),
  stockId: z.string().trim().optional().nullable().or(z.literal("")),
  priceSource: z.string().trim().max(50).optional().default(""),
  sourceRef: z.string().trim().max(100).optional().default(""),
});

const createInvoiceSchema = z.object({
  animalId: z.string().trim().optional().nullable().or(z.literal("")),
  customerId: z.string().trim().optional().nullable().or(z.literal("")),
  ownerId: z.string().trim().optional().nullable().or(z.literal("")),
  date: z.string().trim().min(1, "Tarih gerekli."),
  items: z.array(invoiceItemSchema).min(1, "En az bir fatura kalemi gerekli."),
  discountType: z.enum(["none", "amount", "percent"]).optional().default("none"),
  discountValue: z.coerce.number().min(0).optional().default(0),
  vatEnabled: z.boolean().optional().default(false),
  vatRate: z.coerce.number().min(0).max(100).optional().default(0),
  paymentStatus: z.string().trim().max(50).optional().default(""),
  cancelled: z.boolean().optional().default(false),
  note: z.string().trim().max(1000).optional().default(""),
  invoiceNumber: z.string().trim().optional(),
});

const updateInvoiceSchema = createInvoiceSchema.partial().extend({
  items: z.array(invoiceItemSchema).min(1).optional(),
});

module.exports = { createInvoiceSchema, updateInvoiceSchema };
