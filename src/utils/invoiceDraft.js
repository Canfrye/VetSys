/**
 * Klinik kayıtlardan taslak fatura satırları üretir.
 * Kaydetmez — yalnızca InvoiceForm önizlemesi için.
 */

import { generateId } from "../services/apiClient";
import {
  findServiceByName,
  getServiceDefaultPrice,
  normalizeMoney,
} from "./serviceCatalog";
import { todayDateOnly, toDateOnly } from "./dateRange";
import { isInvoiceCancelled } from "./paymentUtils";

function namesMatch(a, b) {
  return (
    String(a || "")
      .trim()
      .toLocaleLowerCase("tr") ===
    String(b || "")
      .trim()
      .toLocaleLowerCase("tr")
  );
}

function findStockByName(stockItems = [], name) {
  return (
    stockItems.find((s) => namesMatch(s.name, name)) || null
  );
}

function line({
  type,
  description,
  unitPrice,
  quantity = 1,
  purchasePrice = 0,
  stockId = "",
  priceSource = "auto",
  sourceRef = "",
}) {
  const sale = normalizeMoney(unitPrice);
  const cost = normalizeMoney(purchasePrice);

  return {
    id: generateId(),
    type,
    description: String(description || "").trim(),
    unitPrice: sale,
    quantity: Number(quantity) || 1,
    purchasePrice: cost,
    stockId: stockId || "",
    priceSource,
    sourceRef,
    subtotal: sale * (Number(quantity) || 1),
  };
}

/**
 * @param {object} params
 * @param {object} params.animal
 * @param {object} [params.examination]
 * @param {object[]} [params.vaccines]
 * @param {object[]} [params.prescriptions]
 * @param {object[]} [params.stockItems]
 * @param {object} [params.settings]
 * @param {string} [params.date]
 */
export function buildClinicalInvoiceDraft({
  animal,
  examination = null,
  vaccines = [],
  prescriptions = [],
  stockItems = [],
  settings = {},
  date = todayDateOnly(),
} = {}) {
  const items = [];
  const serviceFees = settings.serviceFees;

  if (examination) {
    const examType =
      examination.examType || examination.examinationType || "Genel Muayene";
    const fee =
      examination.fee != null && examination.fee !== ""
        ? normalizeMoney(examination.fee)
        : getServiceDefaultPrice(serviceFees, examType);

    if (fee > 0 || examType) {
      const service = findServiceByName(serviceFees, examType);
      items.push(
        line({
          type: "Muayene",
          description: examType,
          unitPrice: fee,
          purchasePrice: 0,
          priceSource: "auto",
          sourceRef: `exam:${examination.id || ""}`,
        })
      );

      // Katalogdaki tedavi hizmetleri değil — muayene satırı
      void service;
    }
  }

  vaccines.forEach((vaccine) => {
    const stock = findStockByName(stockItems, vaccine.vaccineName);
    let unitPrice = 0;
    let purchasePrice = 0;
    let stockId = "";

    if (stock) {
      unitPrice = normalizeMoney(stock.salePrice);
      purchasePrice = normalizeMoney(stock.purchasePrice);
      stockId = stock.id;
    }

    if (vaccine.fee != null && vaccine.fee !== "") {
      unitPrice = normalizeMoney(vaccine.fee);
    }

    if (unitPrice <= 0) {
      unitPrice = getServiceDefaultPrice(serviceFees, "Aşı Uygulama");
    }

    if (unitPrice <= 0 && !vaccine.vaccineName) return;

    items.push(
      line({
        type: "Aşı",
        description: vaccine.vaccineName || "Aşı",
        unitPrice,
        purchasePrice,
        stockId,
        priceSource: "auto",
        sourceRef: `vaccine:${vaccine.id || ""}`,
      })
    );
  });

  // Reçete ilaçları — stokta satış fiyatı olanlar
  prescriptions.forEach((prescription) => {
    (prescription.items || []).forEach((med) => {
      const name = med.medicationName;
      if (!name) return;

      const stock = findStockByName(stockItems, name);
      if (!stock) return;

      const sale = normalizeMoney(stock.salePrice);
      if (sale <= 0) return;

      const qty = Math.max(1, Number(med.quantity) || 1);

      items.push(
        line({
          type: "Ürün",
          description: name,
          unitPrice: sale,
          quantity: qty,
          purchasePrice: normalizeMoney(stock.purchasePrice),
          stockId: stock.id,
          priceSource: "auto",
          sourceRef: `prescription:${prescription.id}:${med.id || name}`,
        })
      );
    });
  });

  // Muayene medicines / procedures metninden stok eşleşmesi (satır satır)
  if (examination) {
    const blobs = [examination.medicines, examination.procedures]
      .filter(Boolean)
      .join("\n")
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    blobs.forEach((token) => {
      const stock = findStockByName(stockItems, token);
      if (!stock) return;

      const sale = normalizeMoney(stock.salePrice);
      if (sale <= 0) return;

      // Aynı ürün reçeteden zaten eklendiyse atla
      if (items.some((i) => namesMatch(i.description, stock.name))) return;

      items.push(
        line({
          type: "Ürün",
          description: stock.name,
          unitPrice: sale,
          purchasePrice: normalizeMoney(stock.purchasePrice),
          stockId: stock.id,
          priceSource: "auto",
          sourceRef: `exam-product:${examination.id}:${stock.id}`,
        })
      );
    });
  }

  return {
    animalId: animal?.id || "",
    animalName: animal?.name || examination?.animalName || "",
    ownerId: animal?.ownerId || examination?.ownerId || "",
    ownerName: animal?.ownerName || examination?.ownerName || "",
    date,
    items:
      items.length > 0
        ? items
        : [
            line({
              type: "Muayene",
              description: "Genel Muayene",
              unitPrice: getServiceDefaultPrice(serviceFees, "Genel Muayene"),
              priceSource: "auto",
            }),
          ],
    discountType: "none",
    discountValue: "",
    vatEnabled: false,
    vatRate: 20,
    cancelled: false,
    paymentStatus: "",
    note: "Otomatik taslak fatura — kaydetmeden önce kontrol edin.",
    isDraftPreview: true,
  };
}

export function resolveStockSalePrice(stockItems, name) {
  const stock = findStockByName(stockItems, name);
  if (!stock) return null;

  return {
    stockId: stock.id,
    salePrice: normalizeMoney(stock.salePrice),
    purchasePrice: normalizeMoney(stock.purchasePrice),
  };
}

/**
 * Faturalanmış aşı id'leri — items.sourceRef = vaccine:{id}
 */
export function getInvoicedVaccineIds(invoices = []) {
  const ids = new Set();

  invoices.forEach((invoice) => {
    if (isInvoiceCancelled(invoice)) return;

    (invoice.items || []).forEach((item) => {
      const ref = String(item.sourceRef || "");
      if (!ref.startsWith("vaccine:")) return;
      const id = ref.slice("vaccine:".length).trim();
      if (id) ids.add(id);
    });
  });

  return ids;
}

export function isVaccineInvoiced(vaccineId, invoices = []) {
  if (!vaccineId) return false;
  return getInvoicedVaccineIds(invoices).has(String(vaccineId));
}

/**
 * Aynı gün / aynı hayvan — tamamlanmış ve henüz faturalanmamış aşılar.
 */
export function collectSameDayUnbilledVaccines({
  triggerVaccine,
  animalVaccines = [],
  invoices = [],
} = {}) {
  if (!triggerVaccine) return [];

  const billed = getInvoicedVaccineIds(invoices);
  const animalId = String(triggerVaccine.animalId || "");
  const date = toDateOnly(triggerVaccine.applicationDate || todayDateOnly());

  return animalVaccines.filter((vaccine) => {
    if (String(vaccine.animalId) !== animalId) return false;
    if (toDateOnly(vaccine.applicationDate) !== date) return false;

    const isTrigger = String(vaccine.id) === String(triggerVaccine.id);
    const completed = isTrigger || vaccine.status === "Tamamlandı";

    if (!completed) return false;
    if (billed.has(String(vaccine.id))) return false;

    return true;
  });
}

/**
 * Aşı tamamlandıktan sonra fatura taslağı.
 * Kaydetmez. Faturalanmış aşıları atlar. null = taslak gerekmez.
 */
export function buildVaccineCompletionInvoiceDraft({
  animal,
  vaccines = [],
  stockItems = [],
  settings = {},
  invoices = [],
  date,
} = {}) {
  const billed = getInvoicedVaccineIds(invoices);
  const unbilled = (vaccines || []).filter(
    (vaccine) => vaccine?.id && !billed.has(String(vaccine.id))
  );

  if (unbilled.length === 0) return null;

  const draft = buildClinicalInvoiceDraft({
    animal,
    examination: null,
    vaccines: unbilled,
    prescriptions: [],
    stockItems,
    settings,
    date: date || unbilled[0]?.applicationDate || todayDateOnly(),
  });

  return {
    ...draft,
    vatEnabled: true,
    vatRate: Number(draft.vatRate) || 20,
    note: "Aşı uygulaması için otomatik taslak — kaydetmeden önce kontrol edin.",
    isDraftPreview: true,
  };
}

