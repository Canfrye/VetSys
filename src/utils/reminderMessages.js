/**
 * WhatsApp / SMS / E-posta hatırlatma metinleri.
 * Gerçek gönderim yok — yalnızca taslak.
 */

export function normalizePhoneForWhatsApp(phone) {
  if (!phone) return "";

  let digits = String(phone).replace(/\D/g, "");

  if (!digits) return "";

  // 05xx → 905xx
  if (digits.startsWith("0") && digits.length === 11) {
    digits = `90${digits.slice(1)}`;
  }

  // 5xx (10 hane) → 905xx
  if (digits.length === 10 && digits.startsWith("5")) {
    digits = `90${digits}`;
  }

  return digits;
}

export function buildWhatsAppUrl(phone, message) {
  const digits = normalizePhoneForWhatsApp(phone);
  if (!digits) return "";

  const text = encodeURIComponent(message || "");
  return `https://wa.me/${digits}?text=${text}`;
}

function politeOwnerName(ownerName) {
  const name = String(ownerName || "").trim();
  if (!name || name === "-" || name === "Sahipsiz") {
    return "Değerli Müşterimiz";
  }

  // Zaten unvan içeriyorsa dokunma
  if (/\b(bey|hanım|sayın)\b/i.test(name)) return name;

  return `${name}`;
}

/**
 * @param {object} item - reminder center satırı
 * @param {object} [settings]
 */
export function buildReminderMessage(item, settings = {}) {
  const clinic = settings.clinicName || "klinğimiz";
  const phone = settings.phone || "";
  const owner = politeOwnerName(item.ownerName);
  const animal = item.animalName || "dostunuz";
  const title = item.title || item.kindLabel || "işlem";
  const dateLabel = item.date
    ? new Date(`${item.date}T12:00:00`).toLocaleDateString("tr-TR")
    : "";
  const timePart = item.time ? ` saat ${item.time}` : "";

  let whenText = "yaklaşan tarihte";
  if (item.daysUntil === 0) whenText = "bugün";
  else if (item.daysUntil === 1) whenText = "yarın";
  else if (item.daysUntil != null && item.daysUntil > 1) {
    whenText = `${dateLabel}${timePart}`;
  } else if (item.daysUntil != null && item.daysUntil < 0) {
    whenText = `${dateLabel} tarihinde planlanmıştı (gecikmiş)`;
  } else if (dateLabel) {
    whenText = `${dateLabel}${timePart}`;
  }

  const kindLine =
    item.kind === "vaccine"
      ? `${title} aşısı`
      : item.kind === "control"
        ? `kontrol randevusu (${title})`
        : `randevusu (${title})`;

  const body = [
    `Merhaba ${owner},`,
    "",
    `${animal} isimli dostunuzun ${kindLine} ${whenText} planlanmıştır.`,
    "",
    `Randevu oluşturmak veya bilgi almak için ${clinic} ile iletişime geçebilirsiniz.`,
    phone ? `Tel: ${phone}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const subject = `${clinic} — ${animal} hatırlatma (${item.kindLabel || "Hatırlatma"})`;

  return {
    body,
    subject,
    sms: body.replace(/\n+/g, " ").trim(),
  };
}

export function buildMailtoUrl(email, subject, body) {
  if (!email) return "";
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
}
