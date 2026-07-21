const prisma = require("../../prisma/client");

const DEFAULT_SETTINGS = {
  clinicName: "Doğruyol Veteriner Kliniği",
  veterinarian: "Hasan Doğruyol",
  phone: "",
  email: "",
  website: "",
  taxOffice: "",
  taxNumber: "",
  iban: "",
  licenceNo: "",
  city: "",
  district: "",
  logo: "",
  address: "",
  workingHours: "09:00 - 18:00",
  footer: "VetSys Veteriner Klinik Yönetim Sistemi",
  vaccineTemplates: [],
  serviceFees: [],
  recentBreeds: [],
  recentSelections: {},
  reminderStatuses: {},
  auditLogs: [],
};

function mergeDefaults(data) {
  return {
    ...DEFAULT_SETTINGS,
    ...(data && typeof data === "object" ? data : {}),
  };
}

class SettingsService {
  async get() {
    const row = await prisma.settings.findUnique({ where: { id: "default" } });
    return mergeDefaults(row?.data);
  }

  async put(data) {
    const merged = mergeDefaults(data);
    await prisma.settings.upsert({
      where: { id: "default" },
      create: { id: "default", data: merged },
      update: { data: merged },
    });
    return merged;
  }
}

module.exports = new SettingsService();
module.exports.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
