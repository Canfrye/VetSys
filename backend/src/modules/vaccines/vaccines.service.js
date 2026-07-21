const BaseService = require("../../common/BaseService");
const {
  serializeWithOwner,
  resolveCustomerId,
} = require("../../utils/serialize");
const vaccinesRepository = require("./vaccines.repository");

function buildPayload(data = {}) {
  return {
    animalId: data.animalId,
    customerId: resolveCustomerId(data) || null,
    vaccineName: data.vaccineName,
    brand: data.brand || "",
    batchNo: data.batchNo || "",
    dose: data.dose || "",
    applicationDate: data.applicationDate,
    nextDoseDate: data.nextDoseDate || "",
    fee: data.fee != null && data.fee !== "" ? Number(data.fee) : null,
    veterinarian: data.veterinarian || "",
    notes: data.notes || "",
    status: data.status || "",
  };
}

class VaccinesService extends BaseService {
  constructor() {
    super(vaccinesRepository, "Aşı");
  }

  async list() {
    const rows = await vaccinesRepository.findAll();
    return rows.map(serializeWithOwner);
  }

  async getById(id) {
    const row = await super.getById(id);
    return serializeWithOwner(row);
  }

  async create(data) {
    const created = await vaccinesRepository.create(buildPayload(data));
    return serializeWithOwner(created);
  }

  async update(id, data) {
    await this.getById(id);
    const current = await vaccinesRepository.findById(id);
    const merged = { ...current, ...data };
    if ("ownerId" in data || "customerId" in data) {
      merged.customerId = resolveCustomerId(data);
    }
    const updated = await vaccinesRepository.update(id, buildPayload(merged));
    return serializeWithOwner(updated);
  }
}

module.exports = new VaccinesService();
