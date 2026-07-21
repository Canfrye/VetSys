import { STORAGE_KEYS } from "../utils/storage";
import apiClient from "./apiClient";
import { todayDateOnly, getPresetRange } from "../utils/dateRange";
import {
  buildPrescriptionStockPlan,
  buildStockPayload,
  enrichCriticalStockItem,
  filterMovementsByDate,
  groupStockByExpiry,
  isCriticalStock,
  isOutboundMovement,
  normalizeStockItem,
  sumMovementQuantity,
} from "../utils/stockUtils";
import { createAuditLog } from "./auditLogService";
import { AUDIT_ACTIONS, AUDIT_MODULES } from "../utils/auditLog";

const RESOURCE = STORAGE_KEYS.STOCK;
const MOVEMENTS = STORAGE_KEYS.STOCK_MOVEMENTS;

/* -------------------- Stock CRUD -------------------- */

export async function getStock() {
  const items = await apiClient.getAll(RESOURCE);

  return items
    .map(normalizeStockItem)
    .sort((a, b) => a.name.localeCompare(b.name, "tr"));
}

export async function getStockById(id) {
  const item = await apiClient.getById(RESOURCE, id);
  return item ? normalizeStockItem(item) : null;
}

export async function addStock(item, { userName = "" } = {}) {
  const payload = buildStockPayload(item);
  const created = await apiClient.create(RESOURCE, payload);

  if ((Number(created.quantity) || 0) > 0) {
    await recordMovement({
      stockId: created.id,
      stockName: created.name,
      type: "Giriş",
      quantity: Number(created.quantity) || 0,
      previousQuantity: 0,
      newQuantity: Number(created.quantity) || 0,
      userName,
      note: "İlk stok girişi",
      date: todayDateOnly(),
    });
  }

  await createAuditLog({
    module: AUDIT_MODULES.STOCK,
    action: AUDIT_ACTIONS.CREATE,
    description: `Stok ürünü eklendi: ${created.name}`,
    entityId: created.id,
  });

  return created;
}

export function updateStock(item) {
  return apiClient.update(RESOURCE, item.id, {
    ...buildStockPayload(item),
    id: item.id,
  });
}

export async function deleteStock(id) {
  await apiClient.removeWhere(
    MOVEMENTS,
    (m) => String(m.stockId) === String(id)
  );
  return apiClient.remove(RESOURCE, id);
}

export async function getCriticalStock() {
  const items = await getStock();
  return items.filter(isCriticalStock).map(enrichCriticalStockItem);
}

export async function getExpiredStock() {
  const today = todayDateOnly();
  const items = await getStock();
  return items.filter((i) => i.expiryDate && i.expiryDate < today);
}

export async function getExpiringStock(withinDays = 30) {
  const items = await getStock();
  return groupStockByExpiry(items, withinDays);
}

export async function getStockCount() {
  const items = await apiClient.getAll(RESOURCE);
  return items.length;
}

/* -------------------- Movements -------------------- */

export async function getStockMovements() {
  const movements = await apiClient.getAll(MOVEMENTS);

  return [...movements].sort(
    (a, b) =>
      new Date(b.createdAt || `${b.date}T00:00:00`) -
        new Date(a.createdAt || `${a.date}T00:00:00`) ||
      String(b.id).localeCompare(String(a.id))
  );
}

export async function getMovementsByStockId(stockId) {
  const movements = await getStockMovements();
  return movements.filter((m) => String(m.stockId) === String(stockId));
}

async function recordMovement({
  stockId,
  stockName,
  type,
  quantity,
  previousQuantity,
  newQuantity,
  userName = "",
  note = "",
  date = todayDateOnly(),
  prescriptionId = "",
  prescriptionNumber = "",
}) {
  return apiClient.create(MOVEMENTS, {
    stockId,
    stockName: stockName || "",
    type,
    quantity: Number(quantity) || 0,
    previousQuantity: Number(previousQuantity) || 0,
    newQuantity: Number(newQuantity) || 0,
    userName: userName || "",
    note: note || "",
    date,
    prescriptionId: prescriptionId || "",
    prescriptionNumber: prescriptionNumber || "",
  });
}

/**
 * Manuel stok hareketi: Giriş / Çıkış / Düzeltme.
 * Negatif stok oluşmaz.
 */
export async function applyStockMovement({
  stockId,
  type,
  quantity,
  userName = "",
  note = "",
  date = todayDateOnly(),
}) {
  const stock = await getStockById(stockId);

  if (!stock) {
    throw new Error("Stok kalemi bulunamadı.");
  }

  const amount = Number(quantity);
  if (!amount || amount <= 0) {
    throw new Error("Miktar 0'dan büyük olmalıdır.");
  }

  const previous = Number(stock.quantity) || 0;
  let next;

  if (type === "Giriş") {
    next = previous + amount;
  } else if (type === "Çıkış") {
    if (amount > previous) {
      throw new Error(
        `Yetersiz stok. Mevcut: ${previous} ${stock.unit || ""}`.trim()
      );
    }
    next = previous - amount;
  } else if (type === "Düzeltme") {
    next = amount;
  } else {
    throw new Error("Geçersiz hareket türü.");
  }

  if (next < 0) {
    throw new Error("Stok negatif olamaz.");
  }

  const updated = await updateStock({
    ...stock,
    quantity: next,
  });

  const movementQty =
    type === "Düzeltme" ? Math.abs(next - previous) : amount;

  const movement = await recordMovement({
    stockId: stock.id,
    stockName: stock.name,
    type,
    quantity: movementQty,
    previousQuantity: previous,
    newQuantity: next,
    userName,
    note,
    date,
  });

  const action =
    type === "Giriş"
      ? AUDIT_ACTIONS.STOCK_IN
      : type === "Çıkış"
        ? AUDIT_ACTIONS.STOCK_OUT
        : AUDIT_ACTIONS.STOCK_ADJUST;

  await createAuditLog({
    module: AUDIT_MODULES.STOCK,
    action,
    description: `Stok ${type.toLocaleLowerCase("tr")}: ${stock.name} (${movementQty})`,
    entityId: stock.id,
  });

  return { stock: updated, movement };
}

/* -------------------- Prescription deduction -------------------- */

export async function previewPrescriptionStockImpact(items = []) {
  const stockItems = await getStock();
  return buildPrescriptionStockPlan(stockItems, items);
}

/**
 * Reçete kaydı sonrası stok düşümü.
 * Yetersiz stokta mevcut kadar düşer; negatif oluşmaz.
 */
export async function deductStockForPrescription(
  prescription,
  { userName = "" } = {}
) {
  const impact = await previewPrescriptionStockImpact(
    prescription.items || []
  );

  const results = [];

  for (const step of impact.plan) {
    const stock = await getStockById(step.stockId);
    if (!stock) continue;

    const previous = Number(stock.quantity) || 0;
    const deduct = Math.min(step.deduct, previous);
    if (deduct <= 0) continue;

    const next = previous - deduct;

    await updateStock({ ...stock, quantity: next });

    const movement = await recordMovement({
      stockId: stock.id,
      stockName: stock.name,
      type: "Reçete",
      quantity: deduct,
      previousQuantity: previous,
      newQuantity: next,
      userName,
      note: `Reçete ${prescription.prescriptionNumber || ""}`.trim(),
      date: prescription.date || todayDateOnly(),
      prescriptionId: prescription.id || "",
      prescriptionNumber: prescription.prescriptionNumber || "",
    });

    results.push(movement);
  }

  return { ...impact, movements: results };
}

/* -------------------- Consumption KPIs -------------------- */

export async function getConsumedQuantity({ startDate, endDate } = {}) {
  const movements = await getStockMovements();
  const filtered = filterMovementsByDate(movements, startDate, endDate);

  return sumMovementQuantity(filtered, isOutboundMovement);
}

export async function getTodayConsumedQuantity() {
  const today = todayDateOnly();
  return getConsumedQuantity({ startDate: today, endDate: today });
}

export async function getMonthConsumedQuantity() {
  const range = getPresetRange("month");
  return getConsumedQuantity({
    startDate: range.startDate,
    endDate: range.endDate,
  });
}

export async function getMedicationConsumptionReport({
  startDate,
  endDate,
} = {}) {
  const movements = await getStockMovements();
  const filtered = filterMovementsByDate(
    movements,
    startDate,
    endDate
  ).filter(isOutboundMovement);

  const byProduct = {};

  filtered.forEach((m) => {
    const key = m.stockName || "Bilinmeyen";
    if (!byProduct[key]) {
      byProduct[key] = { name: key, quantity: 0, movements: 0 };
    }
    byProduct[key].quantity += Number(m.quantity) || 0;
    byProduct[key].movements += 1;
  });

  const items = Object.values(byProduct).sort(
    (a, b) => b.quantity - a.quantity
  );

  return {
    total: items.reduce((sum, i) => sum + i.quantity, 0),
    items,
    movements: filtered,
  };
}
