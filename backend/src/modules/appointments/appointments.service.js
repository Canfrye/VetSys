const BaseService = require("../../common/BaseService");
const AppError = require("../../utils/AppError");
const {
  serializeWithOwner,
  resolveCustomerId,
} = require("../../utils/serialize");

const appointmentsRepository = require("./appointments.repository");

const toMinutes = (time) => {
  const [h, m] = (time || "0:0").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

function buildPayload(data = {}) {
  return {
    animalId: data.animalId,
    customerId: resolveCustomerId(data) || null,
    date: data.date,
    time: data.time,
    duration: Number(data.duration) || 30,
    veterinarian: data.veterinarian || "",
    reason: data.reason || "",
    status: data.status || "Bekliyor",
    note: data.note || "",
  };
}

class AppointmentsService extends BaseService {
  constructor() {
    super(appointmentsRepository, "Randevu");
  }

  async assertNoConflict({ veterinarian, date, time, duration = 30 }, excludeId = null) {
    if (!veterinarian || !date || !time) return;

    const startMinutes = toMinutes(time);
    const endMinutes = startMinutes + (Number(duration) || 30);

    const candidates = await appointmentsRepository.findByVeterinarianAndDate(
      veterinarian,
      date,
      excludeId
    );

    const conflict = candidates.find((appointment) => {
      const otherStart = toMinutes(appointment.time);
      const otherEnd = otherStart + (Number(appointment.duration) || 30);

      return startMinutes < otherEnd && otherStart < endMinutes;
    });

    if (conflict) {
      throw AppError.conflict(
        `${veterinarian} için ${date} ${time} saatinde çakışan bir randevu mevcut.`
      );
    }
  }

  async list() {
    const rows = await appointmentsRepository.findAll();
    return rows.map(serializeWithOwner);
  }

  async getById(id) {
    const row = await super.getById(id);
    return serializeWithOwner(row);
  }

  async create(data) {
    const payload = buildPayload(data);
    await this.assertNoConflict(payload);
    const created = await appointmentsRepository.create(payload);
    return serializeWithOwner(created);
  }

  async update(id, data) {
    const current = await super.getById(id);
    const payload = {
      veterinarian: data.veterinarian ?? current.veterinarian,
      date: data.date ?? current.date,
      time: data.time ?? current.time,
      duration: data.duration ?? current.duration,
      animalId: data.animalId ?? current.animalId,
      customerId:
        "customerId" in data || "ownerId" in data
          ? resolveCustomerId(data)
          : current.customerId,
      reason: data.reason ?? current.reason,
      status: data.status ?? current.status,
      note: data.note ?? current.note,
    };

    await this.assertNoConflict(payload, id);

    const updated = await appointmentsRepository.update(id, payload);
    return serializeWithOwner(updated);
  }
}

module.exports = new AppointmentsService();
