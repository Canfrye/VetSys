/**
 * Denetim kaydı — tek createAuditLog yardımcısı.
 * Kayıtlar Settings.auditLogs içinde saklanır (yeni storage key yok).
 */

import { generateId } from "../services/apiClient";

export const AUDIT_MODULES = {
  CUSTOMER: "Müşteri",
  ANIMAL: "Hayvan",
  APPOINTMENT: "Randevu",
  EXAMINATION: "Muayene",
  VACCINE: "Aşı",
  PRESCRIPTION: "Reçete",
  INVOICE: "Fatura",
  PAYMENT: "Tahsilat",
  STOCK: "Stok",
  SETTINGS: "Ayarlar",
};

export const AUDIT_ACTIONS = {
  CREATE: "oluşturuldu",
  UPDATE: "güncellendi",
  DELETE: "silindi",
  MOVE: "taşındı",
  DURATION: "süresi değişti",
  COMPLETE: "tamamlandı",
  CANCEL: "iptal edildi",
  SCHEDULE: "takvim oluşturuldu",
  RESCHEDULE: "yeniden oluşturuldu",
  PDF: "PDF indirildi",
  DRAFT: "taslak oluşturuldu",
  SAVE: "kaydedildi",
  PAYMENT_RECEIVED: "ödeme alındı",
  PAYMENT_DELETED: "ödeme silindi",
  STOCK_IN: "giriş yapıldı",
  STOCK_OUT: "çıkış yapıldı",
  STOCK_ADJUST: "düzeltme yapıldı",
  CHANGED: "değiştirildi",
};

export const MAX_AUDIT_LOGS = 2000;

export function normalizeAuditLogs(logs) {
  if (!Array.isArray(logs)) return [];
  return logs;
}

/**
 * Ham audit kaydı nesnesi üretir (persist etmez).
 */
export function buildAuditEntry({
  module,
  action,
  description,
  entityId = "",
  animalId = "",
  ownerId = "",
  user = null,
  meta = null,
} = {}) {
  const now = new Date();

  return {
    id: generateId(),
    createdAt: now.toISOString(),
    date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
    time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
    userId: user?.id || "",
    userName: user?.fullName || user?.username || "Sistem",
    userRole: user?.role || "",
    module: module || "",
    action: action || "",
    description: String(description || "").trim(),
    entityId: entityId ? String(entityId) : "",
    animalId: animalId ? String(animalId) : "",
    ownerId: ownerId ? String(ownerId) : "",
    meta: meta || null,
  };
}

export function formatAuditHeadline(entry) {
  if (!entry) return "";
  const who = entry.userName || "Kullanıcı";
  const what = entry.description || `${entry.module} ${entry.action}`;
  return `${who} · ${what}`;
}
