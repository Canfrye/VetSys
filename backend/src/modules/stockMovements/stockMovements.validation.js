const { z } = require("zod");

const createStockMovementSchema = z.object({
  stockId: z.string().trim().min(1, "Stok kalemi gerekli."),
  stockName: z.string().trim().max(200).optional().default(""),
  type: z.string().trim().min(1, "Hareket türü gerekli."),
  quantity: z.coerce.number().min(0).optional().default(0),
  previousQuantity: z.coerce.number().min(0).optional().default(0),
  newQuantity: z.coerce.number().min(0).optional().default(0),
  userName: z.string().trim().max(100).optional().default(""),
  note: z.string().trim().max(1000).optional().default(""),
  date: z.string().trim().min(1, "Tarih gerekli."),
  prescriptionId: z.string().trim().max(100).optional().default(""),
  prescriptionNumber: z.string().trim().max(50).optional().default(""),
});

const updateStockMovementSchema = createStockMovementSchema.partial();

module.exports = { createStockMovementSchema, updateStockMovementSchema };
