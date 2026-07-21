const BaseService = require("../../common/BaseService");
const {
  serializePrescription,
  resolveCustomerId,
} = require("../../utils/serialize");
const prescriptionsRepository = require("./prescriptions.repository");

function normalizeItems(items = []) {
  return items.map((item) => ({
    medicationName: item.medicationName,
    dose: item.dose || "",
    quantity: Number(item.quantity) || 1,
    frequency: item.frequency || "",
    duration: item.duration || "",
    instructions: item.instructions || "",
  }));
}

function buildPayload(data = {}) {
  const customerId = resolveCustomerId(data);
  const animalId = data.animalId || null;

  return {
    animalId: animalId || null,
    customerId: customerId || null,
    veterinarian: data.veterinarian || "",
    examinationId: data.examinationId || "",
    examinationDate: data.examinationDate || "",
    date: data.date,
    diagnosis: data.diagnosis || "",
    notes: data.notes || "",
    items: normalizeItems(data.items || []),
  };
}

class PrescriptionsService extends BaseService {
  constructor() {
    super(prescriptionsRepository, "Reçete");
  }

  async generatePrescriptionNumber() {
    const year = new Date().getFullYear();
    const prefix = `REC-${year}-`;
    const count = await prescriptionsRepository.count({
      where: { prescriptionNumber: { startsWith: prefix } },
    });
    return `${prefix}${String(count + 1).padStart(4, "0")}`;
  }

  async list() {
    const rows = await prescriptionsRepository.findAll();
    return rows.map(serializePrescription);
  }

  async getById(id) {
    const row = await super.getById(id);
    return serializePrescription(row);
  }

  async create(data) {
    const prescriptionNumber =
      data.prescriptionNumber || (await this.generatePrescriptionNumber());
    const payload = buildPayload(data);
    const created = await prescriptionsRepository.create({
      prescriptionNumber,
      ...payload,
    });
    return serializePrescription(created);
  }

  async update(id, data) {
    await this.getById(id);
    const payload = buildPayload({ ...data, items: data.items });
    if (!data.items) delete payload.items;
    if (data.prescriptionNumber) {
      payload.prescriptionNumber = data.prescriptionNumber;
    }
    const updated = await prescriptionsRepository.update(id, payload);
    return serializePrescription(updated);
  }
}

module.exports = new PrescriptionsService();
