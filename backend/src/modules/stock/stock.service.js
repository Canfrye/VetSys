const BaseService = require("../../common/BaseService");
const { serializeStock } = require("../../utils/serialize");
const stockRepository = require("./stock.repository");

function buildPayload(data = {}) {
  const minQuantity = Number(data.minQuantity ?? data.criticalLevel) || 0;
  const price = Number(data.price ?? data.salePrice) || 0;

  return {
    name: data.name,
    category: data.category || "",
    quantity: Number(data.quantity) || 0,
    unit: data.unit || "",
    minQuantity,
    criticalLevel: Number(data.criticalLevel ?? minQuantity) || 0,
    price,
    purchasePrice: Number(data.purchasePrice) || 0,
    expiryDate: data.expiryDate || "",
    lotNo: data.lotNo || "",
    supplierName: data.supplierName || data.supplier || "",
    supplierPhone: data.supplierPhone || "",
    supplierEmail: data.supplierEmail || "",
    supplierNote: data.supplierNote || "",
  };
}

class StockService extends BaseService {
  constructor() {
    super(stockRepository, "Stok kalemi");
  }

  async list() {
    const rows = await stockRepository.findAll();
    return rows.map(serializeStock);
  }

  async getById(id) {
    const row = await super.getById(id);
    return serializeStock(row);
  }

  async create(data) {
    const created = await stockRepository.create(buildPayload(data));
    return serializeStock(created);
  }

  async update(id, data) {
    await this.getById(id);
    const current = await stockRepository.findById(id);
    const merged = { ...current, ...data };
    if (data.supplier && !data.supplierName) {
      merged.supplierName = data.supplier;
    }
    const updated = await stockRepository.update(id, buildPayload(merged));
    return serializeStock(updated);
  }
}

module.exports = new StockService();
