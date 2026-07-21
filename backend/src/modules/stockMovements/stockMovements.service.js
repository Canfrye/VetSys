const BaseService = require("../../common/BaseService");
const stockMovementsRepository = require("./stockMovements.repository");

function buildPayload(data = {}) {
  return {
    stockId: data.stockId,
    stockName: data.stockName || "",
    type: data.type,
    quantity: Number(data.quantity) || 0,
    previousQuantity: Number(data.previousQuantity) || 0,
    newQuantity: Number(data.newQuantity) || 0,
    userName: data.userName || "",
    note: data.note || "",
    date: data.date,
    prescriptionId: data.prescriptionId || "",
    prescriptionNumber: data.prescriptionNumber || "",
  };
}

class StockMovementsService extends BaseService {
  constructor() {
    super(stockMovementsRepository, "Stok hareketi");
  }

  async create(data) {
    return stockMovementsRepository.create(buildPayload(data));
  }

  async update(id, data) {
    await this.getById(id);
    return stockMovementsRepository.update(id, buildPayload(data));
  }
}

module.exports = new StockMovementsService();
