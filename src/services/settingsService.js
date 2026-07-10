const STORAGE_KEY = "vetsys_settings";

const defaultSettings = {
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
};

export const getSettings = () => {
  const data = localStorage.getItem(STORAGE_KEY);

  if (!data) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(defaultSettings)
    );

    return defaultSettings;
  }

  return {
    ...defaultSettings,
    ...JSON.parse(data),
  };
};

export const saveSettings = (settings) => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(settings)
  );

  // Uygulamadaki tüm bileşenleri haberdar et
  window.dispatchEvent(new Event("storage"));
};

export const resetSettings = () => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(defaultSettings)
  );

  window.dispatchEvent(new Event("storage"));
};

export const subscribeSettings = (callback) => {
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener("storage", callback);
  };
};