/**
 * Stok / ilaç yardımcıları — SKT, kritiklik, tedarikçi ve hareket hesapları.
 */

import { getDaysUntil } from "./dueDate";
import { todayDateOnly, toDateOnly } from "./dateRange";

export const STOCK_CATEGORIES = ["İlaç", "Aşı", "Sarf"];

export const STOCK_UNITS = [
  "Adet",
  "Kutu",
  "Şişe",
  "Ampul",
  "ml",
  "gr",
  "kg",
];

export const STOCK_MOVEMENT_TYPES = ["Giriş", "Çıkış", "Düzeltme", "Reçete"];

/** Kritiklik bandı: miktar / minimum * 100 (kritik stokta ≤100). */
export function getCriticalityPercent(quantity, minQuantity) {
  const qty = Number(quantity) || 0;
  const min = Number(minQuantity) || 0;

  if (min <= 0) {
    return qty <= 0 ? 0 : 100;
  }

  return Math.round((qty / min) * 1000) / 10;
}

/**
 * @returns {"error"|"warning"|"default"|"success"}
 * %0–25 kırmızı, %25–50 turuncu, %50–100 sarı, üstü yeşil.
 */
export function getCriticalityColor(percent) {
  if (percent <= 25) return "error";
  if (percent <= 50) return "warning";
  if (percent <= 100) return "default";
  return "success";
}

/** MUI Chip için turuncu bandı warning ile; sarı için info. */
export function getCriticalityChipColor(percent) {
  if (percent <= 25) return "error";
  if (percent <= 50) return "warning";
  if (percent <= 100) return "info";
  return "success";
}

export function getShortage(quantity, minQuantity) {
  return Math.max(0, (Number(minQuantity) || 0) - (Number(quantity) || 0));
}

export function isCriticalStock(item) {
  if (!item) return false;
  return (Number(item.quantity) || 0) <= (Number(item.minQuantity) || 0);
}

/** SKT rozeti: geçmiş/bugün kırmızı, ≤7 gün sarı. */
export function getExpiryBadge(expiryDate) {
  const days = getDaysUntil(expiryDate);

  if (days === null) {
    return { label: "SKT yok", color: "default", days: null };
  }

  if (days < 0) {
    return {
      label: `${Math.abs(days)} gün geçti`,
      color: "error",
      days,
    };
  }

  if (days === 0) {
    return { label: "Bugün", color: "error", days };
  }

  if (days <= 7) {
    return { label: `${days} gün kaldı`, color: "warning", days };
  }

  return { label: `${days} gün kaldı`, color: "default", days };
}

/**
 * Yaklaşan / geçmiş SKT grupları.
 * @returns {{ today: object[], week: object[], month: object[], expired: object[], upcoming: object[] }}
 */
export function groupStockByExpiry(items = [], withinDays = 30) {
  const today = [];
  const week = [];
  const month = [];
  const expired = [];
  const upcoming = [];

  items.forEach((item) => {
    if (!item?.expiryDate) return;

    const days = getDaysUntil(item.expiryDate);
    if (days === null) return;

    const withMeta = {
      ...item,
      daysUntilExpiry: days,
      expiryBadge: getExpiryBadge(item.expiryDate),
    };

    if (days < 0) {
      expired.push(withMeta);
      return;
    }

    if (days === 0) today.push(withMeta);
    if (days >= 0 && days <= 7) week.push(withMeta);
    if (days >= 0 && days <= withinDays) {
      month.push(withMeta);
      upcoming.push(withMeta);
    }
  });

  const bySoonest = (a, b) => a.daysUntilExpiry - b.daysUntilExpiry;

  return {
    today: today.sort(bySoonest),
    week: week.sort(bySoonest),
    month: month.sort(bySoonest),
    expired: expired.sort(bySoonest),
    upcoming: upcoming.sort(bySoonest),
  };
}

export function normalizeSupplierFields(item = {}) {
  const supplierName = String(
    item.supplierName ?? item.supplier ?? ""
  ).trim();

  return {
    supplierName,
    supplier: supplierName,
    supplierPhone: String(item.supplierPhone || "").trim(),
    supplierEmail: String(item.supplierEmail || "").trim(),
    supplierNote: String(item.supplierNote || "").trim(),
  };
}

export function normalizeStockItem(item = {}) {
  const supplier = normalizeSupplierFields(item);

  return {
    ...item,
    name: String(item.name || "").trim(),
    category: item.category || "İlaç",
    quantity: Number(item.quantity) || 0,
    minQuantity: Number(item.minQuantity) || 0,
    unit: item.unit || "Adet",
    expiryDate: item.expiryDate || "",
    lotNo: String(item.lotNo || "").trim(),
    purchasePrice: normalizeMoney(item.purchasePrice),
    salePrice: normalizeMoney(item.salePrice),
    currency: item.currency || "TL",
    note: String(item.note || "").trim(),
    ...supplier,
  };
}

/** Decimal para alanı — negatif olamaz. */
export function normalizeMoney(value) {
  if (value === "" || value == null) return 0;
  const num = Number(value);
  if (Number.isNaN(num) || num < 0) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function buildStockPayload(item = {}) {
  const normalized = normalizeStockItem(item);

  return {
    name: normalized.name,
    category: normalized.category,
    quantity: normalized.quantity,
    minQuantity: normalized.minQuantity,
    unit: normalized.unit,
    expiryDate: normalized.expiryDate,
    lotNo: normalized.lotNo,
    purchasePrice: normalized.purchasePrice,
    salePrice: normalized.salePrice,
    currency: normalized.currency || "TL",
    supplierName: normalized.supplierName,
    supplier: normalized.supplierName,
    supplierPhone: normalized.supplierPhone,
    supplierEmail: normalized.supplierEmail,
    supplierNote: normalized.supplierNote,
    note: normalized.note,
  };
}

/** İsim eşleşmesi (TR duyarsız). */
export function namesMatch(a, b) {
  return (
    String(a || "")
      .trim()
      .toLocaleLowerCase("tr") ===
    String(b || "")
      .trim()
      .toLocaleLowerCase("tr")
  );
}

/**
 * Reçete satırı için stok adayı — aynı isimde birden fazla lot varsa
 * en yakın SKT (FEFO), SKT yoksa en yüksek stok.
 */
export function findStockForMedication(stockItems = [], medicationName) {
  const matches = stockItems.filter((item) =>
    namesMatch(item.name, medicationName)
  );

  if (matches.length === 0) return null;

  return [...matches].sort((a, b) => {
    const aExp = a.expiryDate || "9999-12-31";
    const bExp = b.expiryDate || "9999-12-31";
    if (aExp !== bExp) return aExp.localeCompare(bExp);
    return (Number(b.quantity) || 0) - (Number(a.quantity) || 0);
  })[0];
}

/**
 * Reçete satırlarından stok düşüm planı.
 * quantity alanı yoksa 1 kabul edilir.
 */
export function buildPrescriptionStockPlan(stockItems = [], items = []) {
  const plan = [];
  const warnings = [];

  items.forEach((row, index) => {
    const medicationName = String(row.medicationName || "").trim();
    if (!medicationName) return;

    const requested = Math.max(1, Number(row.quantity) || 1);
    const stock = findStockForMedication(stockItems, medicationName);

    if (!stock) {
      warnings.push(
        `${index + 1}. satır: "${medicationName}" stokta bulunamadı (düşüm yok).`
      );
      return;
    }

    const available = Math.max(0, Number(stock.quantity) || 0);
    const deduct = Math.min(requested, available);
    const shortfall = requested - deduct;

    if (shortfall > 0) {
      warnings.push(
        `${stock.name}: istenen ${requested}, mevcut ${available} ${stock.unit || ""} (eksik ${shortfall}).`
          .replace(/\s+/g, " ")
          .trim()
      );
    }

    if (deduct > 0) {
      plan.push({
        stockId: stock.id,
        stockName: stock.name,
        lotNo: stock.lotNo || "",
        unit: stock.unit || "",
        requested,
        deduct,
        shortfall,
        previousQuantity: available,
        newQuantity: available - deduct,
      });
    }
  });

  return {
    plan,
    warnings,
    hasWarnings: warnings.length > 0,
    hasInsufficient: plan.some((p) => p.shortfall > 0) ||
      warnings.some((w) => w.includes("bulunamadı") || w.includes("eksik")),
  };
}

export function enrichCriticalStockItem(item) {
  const quantity = Number(item.quantity) || 0;
  const minQuantity = Number(item.minQuantity) || 0;
  const percent = getCriticalityPercent(quantity, minQuantity);
  const shortage = getShortage(quantity, minQuantity);

  return {
    ...normalizeStockItem(item),
    criticalityPercent: percent,
    shortage,
    criticalityColor: getCriticalityChipColor(percent),
  };
}

export function sumMovementQuantity(movements = [], predicate = () => true) {
  return movements.reduce((sum, m) => {
    if (!predicate(m)) return sum;
    if (m.type === "Giriş") return sum;
    return sum + (Number(m.quantity) || 0);
  }, 0);
}

export function isOutboundMovement(movement) {
  return movement?.type === "Çıkış" || movement?.type === "Reçete";
}

export function filterMovementsByDate(movements = [], startDate, endDate) {
  return movements.filter((m) => {
    const date = m.date || toDateOnly(m.createdAt);
    if (!date) return false;
    if (startDate && date < startDate) return false;
    if (endDate && date > endDate) return false;
    return true;
  });
}

export function getTodayMovementDate() {
  return todayDateOnly();
}

/** Aylık ilaç tüketimi (ürün adına göre). */
export function groupConsumptionByProduct(movements = []) {
  const map = {};

  movements.forEach((m) => {
    if (!isOutboundMovement(m)) return;

    const key = m.stockName || "Bilinmeyen";
    map[key] = (map[key] || 0) + (Number(m.quantity) || 0);
  });

  return Object.entries(map)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity);
}
