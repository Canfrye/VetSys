const BaseService = require("../../common/BaseService");
const {
  serializeWithOwner,
  resolveCustomerId,
} = require("../../utils/serialize");
const examinationsRepository = require("./examinations.repository");

function buildPayload(data = {}) {
  return {
    animalId: data.animalId,
    customerId: resolveCustomerId(data) || null,
    species: data.species || "",
    veterinarian: data.veterinarian || "",
    examinationDate: data.examinationDate,
    examType: data.examType || "",
    fee: data.fee != null && data.fee !== "" ? Number(data.fee) : null,
    complaint: data.complaint || "",
    generalCondition: data.generalCondition || "",
    diagnosis: data.diagnosis || "",
    findings: data.findings || "",
    treatment: data.treatment || "",
    temperature: data.temperature || "",
    pulse: data.pulse || "",
    respiration: data.respiration || "",
    height: data.height || "",
    weight: data.weight != null ? String(data.weight) : "",
    medicines: data.medicines || "",
    procedures: data.procedures || "",
    labResult: data.labResult || "",
    controlDate: data.controlDate || "",
    notes: data.notes || "",
    attachments: data.attachments ?? null,
  };
}

class ExaminationsService extends BaseService {
  constructor() {
    super(examinationsRepository, "Muayene");
  }

  async list() {
    const rows = await examinationsRepository.findAll();
    return rows.map(serializeWithOwner);
  }

  async getById(id) {
    const row = await super.getById(id);
    return serializeWithOwner(row);
  }

  async create(data) {
    const created = await examinationsRepository.create(buildPayload(data));
    return serializeWithOwner(created);
  }

  async update(id, data) {
    await this.getById(id);
    const current = await examinationsRepository.findById(id);
    const merged = { ...current, ...data };
    if ("ownerId" in data || "customerId" in data) {
      merged.customerId = resolveCustomerId(data);
    }
    const updated = await examinationsRepository.update(id, buildPayload(merged));
    return serializeWithOwner(updated);
  }
}

module.exports = new ExaminationsService();
