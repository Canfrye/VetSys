const BaseService = require("../../common/BaseService");
const AppError = require("../../utils/AppError");
const {
  serializeAnimal,
  resolveCustomerId,
} = require("../../utils/serialize");

const animalsRepository = require("./animals.repository");
const customersRepository = require("../customers/customers.repository");

function buildPayload(data = {}) {
  const customerId = resolveCustomerId(data);
  let birthDate = data.birthDate;
  if (birthDate === "" || birthDate == null) birthDate = null;
  else if (typeof birthDate === "string") birthDate = new Date(birthDate);

  return {
    name: data.name,
    species: data.species,
    breed: data.breed || "",
    gender: data.gender || "",
    birthDate,
    color: data.color || "",
    microchipNo: data.microchipNo || null,
    weight: data.weight != null ? String(data.weight) : "",
    passportNo: data.passportNo || "",
    neutered: Boolean(data.neutered),
    active: data.active !== false,
    note: data.note || "",
    ownerType: data.ownerType || "customer",
    otherOwnerName: data.otherOwnerName || "",
    customerId: customerId || null,
  };
}

class AnimalsService extends BaseService {
  constructor() {
    super(animalsRepository, "Hayvan");
  }

  async assertMicrochipAvailable(microchipNo, excludeId = null) {
    if (!microchipNo) return;

    const existing = await animalsRepository.findByMicrochip(microchipNo);

    if (existing && String(existing.id) !== String(excludeId)) {
      throw AppError.conflict("Bu mikroçip numarası başka bir hayvana kayıtlı.");
    }
  }

  async list() {
    const rows = await animalsRepository.findAll();
    return rows.map(serializeAnimal);
  }

  async getById(id) {
    const row = await super.getById(id);
    return serializeAnimal(row);
  }

  async create(data) {
    const payload = buildPayload(data);

    await this.assertMicrochipAvailable(payload.microchipNo);

    if (payload.customerId) {
      const owner = await customersRepository.findById(payload.customerId);
      if (!owner) {
        throw AppError.badRequest("Belirtilen müşteri bulunamadı.");
      }
    }

    const created = await animalsRepository.create(payload);
    return serializeAnimal(created);
  }

  async update(id, data) {
    await this.getById(id);

    const payload = buildPayload({ ...data });
    // partial update: only include provided keys from original data
    const patch = {};
    const fields = [
      "name",
      "species",
      "breed",
      "gender",
      "birthDate",
      "color",
      "microchipNo",
      "weight",
      "passportNo",
      "neutered",
      "active",
      "note",
      "ownerType",
      "otherOwnerName",
      "customerId",
    ];
    for (const key of fields) {
      if (key === "customerId") {
        if ("customerId" in data || "ownerId" in data) {
          patch.customerId = payload.customerId;
        }
        continue;
      }
      if (key in data) patch[key] = payload[key];
    }

    if ("microchipNo" in patch) {
      patch.microchipNo = patch.microchipNo || null;
      await this.assertMicrochipAvailable(patch.microchipNo, id);
    }

    const updated = await animalsRepository.update(id, patch);
    return serializeAnimal(updated);
  }
}

module.exports = new AnimalsService();
