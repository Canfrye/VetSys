const { z } = require("zod");

const createStockSchema = z.object({
  name: z.string().trim().min(1, "Ürün adı gerekli."),
  category: z.string().trim().max(100).optional().default(""),
  quantity: z.coerce.number().min(0).optional().default(0),
  unit: z.string().trim().max(20).optional().default(""),
  minQuantity: z.coerce.number().min(0).optional().default(0),
  criticalLevel: z.coerce.number().int().min(0).optional(),
  price: z.coerce.number().min(0).optional().default(0),
  salePrice: z.coerce.number().min(0).optional(),
  purchasePrice: z.coerce.number().min(0).optional().default(0),
  expiryDate: z.string().trim().max(20).optional().default(""),
  lotNo: z.string().trim().max(100).optional().default(""),
  supplierName: z.string().trim().max(200).optional().default(""),
  supplier: z.string().trim().max(200).optional(),
  supplierPhone: z.string().trim().max(50).optional().default(""),
  supplierEmail: z.string().trim().max(100).optional().default(""),
  supplierNote: z.string().trim().max(1000).optional().default(""),
});

const updateStockSchema = createStockSchema.partial();

module.exports = { createStockSchema, updateStockSchema };
