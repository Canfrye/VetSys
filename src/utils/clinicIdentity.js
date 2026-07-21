/**
 * Klinik kimliği — Settings alanları (yeni storage key yok).
 */

export const LOGO_WARN_BYTES = 300 * 1024;

export const DEFAULT_DAY_HOURS = {
  open: "09:00",
  close: "18:00",
  closed: false,
  lunchEnabled: true,
  lunchStart: "12:00",
  lunchEnd: "13:00",
};

export const DEFAULT_WORKING_HOURS_SCHEDULE = {
  weekday: { ...DEFAULT_DAY_HOURS },
  saturday: {
    ...DEFAULT_DAY_HOURS,
    close: "14:00",
    lunchEnabled: false,
  },
  sunday: {
    ...DEFAULT_DAY_HOURS,
    closed: true,
    lunchEnabled: false,
  },
};

export function normalizeWorkingHoursSchedule(schedule) {
  const base = DEFAULT_WORKING_HOURS_SCHEDULE;
  if (!schedule || typeof schedule !== "object") {
    return {
      weekday: { ...base.weekday },
      saturday: { ...base.saturday },
      sunday: { ...base.sunday },
    };
  }

  const mergeDay = (key) => {
    const src = schedule[key] && typeof schedule[key] === "object" ? schedule[key] : {};
    return {
      ...base[key],
      ...src,
      open: String(src.open || base[key].open),
      close: String(src.close || base[key].close),
      closed: Boolean(src.closed),
      lunchEnabled: Boolean(src.lunchEnabled),
      lunchStart: String(src.lunchStart || base[key].lunchStart),
      lunchEnd: String(src.lunchEnd || base[key].lunchEnd),
    };
  };

  return {
    weekday: mergeDay("weekday"),
    saturday: mergeDay("saturday"),
    sunday: mergeDay("sunday"),
  };
}

export function formatWorkingHoursSummary(schedule) {
  const s = normalizeWorkingHoursSchedule(schedule);
  const parts = [];

  const fmt = (label, day) => {
    if (day.closed) {
      parts.push(`${label}: Kapalı`);
      return;
    }
    let text = `${label}: ${day.open} – ${day.close}`;
    if (day.lunchEnabled) {
      text += ` (öğle ${day.lunchStart}–${day.lunchEnd})`;
    }
    parts.push(text);
  };

  fmt("Hafta içi", s.weekday);
  fmt("Cumartesi", s.saturday);
  fmt("Pazar", s.sunday);
  return parts.join(" · ");
}

/** Klinik adı doluysa kurulum tamamlanmış sayılır. */
export function needsClinicSetup(settings) {
  return !String(settings?.clinicName || "").trim();
}

export function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

/**
 * TR cep / sabit: 05XXXXXXXXX → 0 (5XX) XXX XX XX
 */
export function formatPhoneMask(value) {
  let digits = digitsOnly(value).slice(0, 11);

  if (digits.length === 10 && digits.startsWith("5")) {
    digits = `0${digits}`;
  }

  if (!digits) return "";

  if (digits.length <= 1) return digits;
  if (digits.length <= 4) return `${digits[0]} (${digits.slice(1)}`;
  if (digits.length <= 7) {
    return `${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4)}`;
  }
  if (digits.length <= 9) {
    return `${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return `${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`;
}

export function isValidPhone(value) {
  const d = digitsOnly(value);
  if (d.length === 10 && d.startsWith("5")) return true;
  if (d.length === 11 && d.startsWith("0")) return true;
  return false;
}

export function isValidEmail(value) {
  const v = String(value || "").trim();
  if (!v) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/** TR vergi no: 10 hane (şirket) veya 11 hane (TCKN) */
export function isValidTaxNumber(value) {
  const d = digitsOnly(value);
  return d.length === 10 || d.length === 11;
}

export function validateClinicIdentity(fields, { requireOfficial = true } = {}) {
  const errors = {};
  const clinicName = String(fields.clinicName || "").trim();

  if (!clinicName) {
    errors.clinicName = "Klinik adı zorunludur.";
  }

  if (!isValidPhone(fields.phone)) {
    errors.phone = "Geçerli bir telefon girin (örn. 05XX XXX XX XX).";
  }

  if (!isValidEmail(fields.email)) {
    errors.email = "Geçerli bir e-posta girin.";
  }

  if (requireOfficial) {
    if (!String(fields.taxOffice || "").trim()) {
      errors.taxOffice = "Vergi dairesi zorunludur.";
    }
    if (!isValidTaxNumber(fields.taxNumber)) {
      errors.taxNumber = "Vergi no 10 veya 11 haneli olmalıdır.";
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Görseli Base64 data URL'e çevirir.
 * WEBP → canvas ile PNG (jsPDF uyumu).
 */
export function readLogoAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("Dosya seçilmedi."));
      return;
    }

    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowed.includes(file.type) && !/\.(png|jpe?g|webp)$/i.test(file.name)) {
      reject(new Error("Yalnızca PNG, JPG veya WEBP yükleyebilirsiniz."));
      return;
    }

    const warnLarge = file.size > LOGO_WARN_BYTES;

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Logo okunamadı."));
    reader.onload = () => {
      const dataUrl = String(reader.result || "");

      if (file.type === "image/webp" || /\.webp$/i.test(file.name)) {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            resolve({
              dataUrl: canvas.toDataURL("image/png"),
              warnLarge,
              sizeBytes: file.size,
            });
          } catch {
            reject(new Error("WEBP logo dönüştürülemedi."));
          }
        };
        img.onerror = () => reject(new Error("Logo önizlemesi oluşturulamadı."));
        img.src = dataUrl;
        return;
      }

      resolve({ dataUrl, warnLarge, sizeBytes: file.size });
    };
    reader.readAsDataURL(file);
  });
}

export function pickClinicIdentityFields(settings = {}) {
  return {
    clinicName: settings.clinicName || "",
    clinicOwner: settings.clinicOwner || "",
    veterinarian: settings.veterinarian || "",
    phone: settings.phone || "",
    email: settings.email || "",
    website: settings.website || "",
    address: settings.address || "",
    city: settings.city || "",
    district: settings.district || "",
    taxOffice: settings.taxOffice || "",
    taxNumber: settings.taxNumber || "",
    mersis: settings.mersis || "",
    tradeRegistryNo: settings.tradeRegistryNo || "",
    iban: settings.iban || "",
    licenceNo: settings.licenceNo || "",
    logo: settings.logo || "",
    footer: settings.footer || "",
    workingHoursSchedule: normalizeWorkingHoursSchedule(
      settings.workingHoursSchedule
    ),
    workingHours:
      settings.workingHours ||
      formatWorkingHoursSummary(settings.workingHoursSchedule),
  };
}
