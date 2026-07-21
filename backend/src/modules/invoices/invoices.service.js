const BaseService = require("../../common/BaseService");
const AppError = require("../../utils/AppError");
const { calculateItemSubtotal, calculateInvoiceTotals } = require("../../utils/invoiceCalc");
const {
  serializeInvoice,
  resolveCustomerId,
} = require("../../utils/serialize");

const invoicesRepository = require("./invoices.repository");

function normalizeItems(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    throw AppError.badRequest("Fatura en az bir kalem içermelidir.");
  }

  return items.map((item) => ({
    type: item.type,
    description: item.description || "",
    unitPrice: Number(item.unitPrice) || 0,
    quantity: Number(item.quantity) || 1,
    purchasePrice: Number(item.purchasePrice) || 0,
    stockId: item.stockId || null,
    priceSource: item.priceSource || "",
    sourceRef: item.sourceRef || "",
    subtotal: calculateItemSubtotal(item),
  }));
}

function buildInvoicePayload(invoice) {
  const items = normalizeItems(invoice.items);

  const totals = calculateInvoiceTotals({
    items,
    discountType: invoice.discountType || "none",
    discountValue: Number(invoice.discountValue) || 0,
    vatEnabled: Boolean(invoice.vatEnabled),
    vatRate: Number(invoice.vatRate) || 0,
  });

  return {
    animalId: invoice.animalId || null,
    customerId: resolveCustomerId(invoice) || null,
    date: invoice.date,
    items,
    discountType: invoice.discountType || "none",
    discountValue: Number(invoice.discountValue) || 0,
    vatEnabled: Boolean(invoice.vatEnabled),
    vatRate: Number(invoice.vatRate) || 0,
    paymentStatus: invoice.paymentStatus || "",
    cancelled: Boolean(invoice.cancelled) || invoice.paymentStatus === "İptal",
    note: invoice.note || "",
    ...totals,
  };
}

class InvoicesService extends BaseService {
  constructor() {
    super(invoicesRepository, "Fatura");
  }

  async generateInvoiceNumber() {
    const year = new Date().getFullYear();
    const prefix = `FAT-${year}-`;
    const count = await invoicesRepository.count({
      where: { invoiceNumber: { startsWith: prefix } },
    });
    return `${prefix}${String(count + 1).padStart(4, "0")}`;
  }

  async list() {
    const rows = await invoicesRepository.findAll();
    return rows.map(serializeInvoice);
  }

  async getById(id) {
    const row = await super.getById(id);
    return serializeInvoice(row);
  }

  async create(data) {
    const invoiceNumber =
      data.invoiceNumber || (await this.generateInvoiceNumber());
    const payload = buildInvoicePayload(data);
    const created = await invoicesRepository.create({ invoiceNumber, ...payload });
    return serializeInvoice(created);
  }

  async update(id, data) {
    await this.getById(id);
    const payload = buildInvoicePayload(data);
    if (data.invoiceNumber) payload.invoiceNumber = data.invoiceNumber;
    const updated = await invoicesRepository.update(id, payload);
    return serializeInvoice(updated);
  }

  async getByAnimalId(animalId) {
    const rows = await invoicesRepository.findByAnimalId(animalId);
    return rows.map(serializeInvoice);
  }
}

module.exports = new InvoicesService();
