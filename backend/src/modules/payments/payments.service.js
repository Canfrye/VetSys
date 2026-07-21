const BaseService = require("../../common/BaseService");
const {
  serializeWithOwner,
  resolveCustomerId,
} = require("../../utils/serialize");
const paymentsRepository = require("./payments.repository");

function serializePayment(payment) {
  if (!payment) return null;
  return serializeWithOwner(payment);
}

function buildPayload(data = {}) {
  const customerId = resolveCustomerId(data);

  return {
    invoiceId: data.invoiceId || null,
    invoiceNumber: data.invoiceNumber || "",
    animalId: data.animalId || null,
    customerId: customerId || null,
    amount: Number(data.amount) || 0,
    method: data.method || "Nakit",
    date: data.date,
    note: data.note || "",
  };
}

class PaymentsService extends BaseService {
  constructor() {
    super(paymentsRepository, "Ödeme");
  }

  async generateReceiptNumber() {
    const year = new Date().getFullYear();
    const prefix = `MAK-${year}-`;
    const count = await paymentsRepository.count({
      where: { receiptNumber: { startsWith: prefix } },
    });
    return `${prefix}${String(count + 1).padStart(4, "0")}`;
  }

  async list() {
    const rows = await paymentsRepository.findAll();
    return rows.map(serializePayment);
  }

  async getById(id) {
    const row = await super.getById(id);
    return serializePayment(row);
  }

  async create(data) {
    const receiptNumber =
      data.receiptNumber || (await this.generateReceiptNumber());
    const created = await paymentsRepository.create({
      receiptNumber,
      ...buildPayload(data),
    });
    return serializePayment(created);
  }

  async update(id, data) {
    await this.getById(id);
    const payload = buildPayload(data);
    if (data.receiptNumber) payload.receiptNumber = data.receiptNumber;
    const updated = await paymentsRepository.update(id, payload);
    return serializePayment(updated);
  }
}

module.exports = new PaymentsService();
