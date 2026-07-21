/**
 * analyticsService — Dashboard ve Reports'un paylaştığı ortak analiz katmanı.
 * Yeni storage key eklemez; mevcut servis verilerini agrege eder.
 */

import { getInvoices } from "./invoiceService";
import { getPayments, getOutstandingInvoices } from "./paymentService";
import { getVaccines } from "./vaccineService";
import {
  getAppointments,
  getAppointmentsByDateRange,
} from "./appointmentService";
import { getExaminations } from "./examinationService";
import { getPrescriptions } from "./prescriptionService";
import { getAnimals } from "./animalService";
import { getCustomers } from "./customerService";
import {
  getStock,
  getStockMovements,
  getCriticalStock,
  getExpiringStock,
} from "./stockService";
import { getSettings } from "./settingsService";

import {
  isDateInRange,
  getDayCount,
  getPresetRange,
  toDateOnly,
} from "../utils/dateRange";
import {
  sumInvoiceRevenueInRange,
  calculateInvoiceTotals,
} from "../utils/invoiceCalc";
import {
  isInvoiceCancelled,
  attachInvoiceBalances,
  sumPaymentsInRange,
} from "../utils/paymentUtils";
import {
  aggregateProfitability,
  rankInvoiceItemsByProfit,
  sumInvoiceProfit,
} from "../utils/profitability";
import {
  isOutboundMovement,
  filterMovementsByDate,
} from "../utils/stockUtils";
import { ROLES } from "../utils/roles";
import { apiRequest, USE_API } from "./apiClient";

export { getPresetRange };

const round2 = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const MONTH_LABELS = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
];

function monthKey(dateStr) {
  if (!dateStr || dateStr.length < 7) return "";
  return dateStr.slice(0, 7);
}

function monthLabel(key) {
  if (!key) return "-";
  const [, m] = key.split("-");
  const idx = Number(m) - 1;
  return `${MONTH_LABELS[idx] || m} ${key.slice(0, 4)}`;
}

function normalizeVetName(name) {
  return String(name || "")
    .trim()
    .toLocaleLowerCase("tr");
}

function matchesVeterinarian(recordVet, user) {
  if (!user) return true;
  if (user.role === ROLES.ADMIN) return true;
  if (user.role !== ROLES.VETERINARIAN) return true;

  const target = normalizeVetName(user.fullName || user.username);
  if (!target) return false;

  const record = normalizeVetName(recordVet);
  return record === target || record.includes(target) || target.includes(record);
}

function getInvoiceDiscountAmount(invoice) {
  if (invoice.discountAmount != null) {
    return Number(invoice.discountAmount) || 0;
  }

  return (
    calculateInvoiceTotals({
      items: invoice.items || [],
      discountType: invoice.discountType || "none",
      discountValue: Number(invoice.discountValue) || 0,
      vatEnabled: Boolean(invoice.vatEnabled),
      vatRate: Number(invoice.vatRate) || 0,
    }).discountAmount || 0
  );
}

function sortDesc(rows, key) {
  return [...rows].sort((a, b) => (Number(b[key]) || 0) - (Number(a[key]) || 0));
}

function buildMonthBuckets(range) {
  const start = range?.startDate || toDateOnly(new Date());
  const end = range?.endDate || start;
  const buckets = [];

  let cursor = `${start.slice(0, 7)}-01`;
  const endMonth = end.slice(0, 7);

  while (monthKey(cursor) <= endMonth) {
    const key = monthKey(cursor);
    buckets.push(key);

    const [y, m] = key.split("-").map(Number);
    const next = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
    cursor = next;

    if (buckets.length > 36) break;
  }

  return buckets;
}

function emptySeries(buckets) {
  return buckets.map((key) => ({
    key,
    label: monthLabel(key),
    value: 0,
  }));
}

function fillSeries(buckets, map) {
  return buckets.map((key) => ({
    key,
    label: monthLabel(key),
    value: round2(map[key] || 0),
  }));
}

/* -------------------- Dataset -------------------- */

export async function fetchAnalyticsDataset() {
  if (USE_API) {
    const data = await apiRequest("GET", "/analytics/dataset");
    return {
      ...data,
      invoicesWithBalances: attachInvoiceBalances(
        data.invoices || [],
        data.payments || []
      ),
    };
  }

  const [
    invoices,
    payments,
    appointments,
    examinations,
    vaccines,
    prescriptions,
    animals,
    customers,
    stock,
    movements,
    criticalStock,
    expiringStock,
    outstanding,
    settings,
  ] = await Promise.all([
    getInvoices(),
    getPayments(),
    getAppointments(),
    getExaminations(),
    getVaccines(),
    getPrescriptions(),
    getAnimals(),
    getCustomers(),
    getStock(),
    getStockMovements(),
    getCriticalStock(),
    getExpiringStock(30),
    getOutstandingInvoices(),
    getSettings(),
  ]);

  const expiringList = [
    ...(expiringStock?.expired || []),
    ...(expiringStock?.upcoming || []),
  ];

  return {
    invoices,
    payments,
    appointments,
    examinations,
    vaccines,
    prescriptions,
    animals,
    customers,
    stock,
    movements,
    criticalStock,
    expiringStock: expiringList,
    outstanding,
    settings,
    invoicesWithBalances: attachInvoiceBalances(invoices, payments),
  };
}

/* -------------------- Pure compute -------------------- */

function computeFinance(dataset, range) {
  const { invoices, payments, invoicesWithBalances, outstanding } = dataset;

  const activeInvoices = invoices.filter(
    (invoice) =>
      !isInvoiceCancelled(invoice) &&
      isDateInRange(invoice.date, range.startDate, range.endDate)
  );

  const totalRevenue = sumInvoiceRevenueInRange(invoices, range);
  const totalCollection = sumPaymentsInRange(payments, range);
  const profitability = aggregateProfitability(invoices, range);

  const totalDiscount = round2(
    activeInvoices.reduce(
      (sum, invoice) => sum + getInvoiceDiscountAmount(invoice),
      0
    )
  );

  const avgInvoice =
    activeInvoices.length > 0
      ? round2(totalRevenue / activeInvoices.length)
      : 0;

  const rangePayments = payments.filter((p) =>
    isDateInRange(p.date, range.startDate, range.endDate)
  );

  const avgPayment =
    rangePayments.length > 0
      ? round2(totalCollection / rangePayments.length)
      : 0;

  const pendingInRange = invoicesWithBalances.filter(
    (invoice) =>
      !isInvoiceCancelled(invoice) &&
      isDateInRange(invoice.date, range.startDate, range.endDate) &&
      (invoice.paymentStatus === "Bekliyor" || invoice.paymentStatus === "Kısmi")
  );

  const pendingAmount = round2(
    pendingInRange.reduce(
      (sum, invoice) => sum + (Number(invoice.remainingAmount) || 0),
      0
    )
  );

  return {
    totalRevenue,
    totalCollection,
    pendingCollection: pendingAmount,
    outstandingDebt: outstanding?.totalDebt || 0,
    netProfit: profitability.profit,
    grossProfit: profitability.profit,
    margin: profitability.margin,
    cost: profitability.cost,
    sale: profitability.sale,
    avgInvoice,
    avgPayment,
    totalDiscount,
    invoiceCount: activeInvoices.length,
    paymentCount: rangePayments.length,
  };
}

function computeMonthlySeries(dataset, range) {
  const buckets = buildMonthBuckets(range);
  const revenueMap = {};
  const collectionMap = {};
  const profitMap = {};
  const customerMap = {};
  const animalMap = {};
  const appointmentMap = {};

  buckets.forEach((key) => {
    revenueMap[key] = 0;
    collectionMap[key] = 0;
    profitMap[key] = 0;
    customerMap[key] = 0;
    animalMap[key] = 0;
    appointmentMap[key] = 0;
  });

  dataset.invoices.forEach((invoice) => {
    if (isInvoiceCancelled(invoice)) return;
    if (!isDateInRange(invoice.date, range.startDate, range.endDate)) return;
    const key = monthKey(invoice.date);
    if (!key || !(key in revenueMap)) return;
    revenueMap[key] += Number(invoice.total) || 0;
    profitMap[key] += sumInvoiceProfit(invoice).profit;
  });

  dataset.payments.forEach((payment) => {
    if (!isDateInRange(payment.date, range.startDate, range.endDate)) return;
    const key = monthKey(payment.date);
    if (!key || !(key in collectionMap)) return;
    collectionMap[key] += Number(payment.amount) || 0;
  });

  dataset.customers.forEach((customer) => {
    const date = toDateOnly(customer.createdAt);
    if (!isDateInRange(date, range.startDate, range.endDate)) return;
    const key = monthKey(date);
    if (!key || !(key in customerMap)) return;
    customerMap[key] += 1;
  });

  dataset.animals.forEach((animal) => {
    const date = toDateOnly(animal.createdAt);
    if (!isDateInRange(date, range.startDate, range.endDate)) return;
    const key = monthKey(date);
    if (!key || !(key in animalMap)) return;
    animalMap[key] += 1;
  });

  dataset.appointments.forEach((appointment) => {
    if (!isDateInRange(appointment.date, range.startDate, range.endDate)) return;
    const key = monthKey(appointment.date);
    if (!key || !(key in appointmentMap)) return;
    appointmentMap[key] += 1;
  });

  return {
    revenue: fillSeries(buckets, revenueMap),
    collection: fillSeries(buckets, collectionMap),
    profit: fillSeries(buckets, profitMap),
    customers: fillSeries(buckets, customerMap),
    animals: fillSeries(buckets, animalMap),
    appointments: fillSeries(buckets, appointmentMap),
    empty: emptySeries(buckets),
  };
}

function computeVeterinarianPerformance(dataset, range, user = null) {
  const map = {};

  const ensure = (name) => {
    const key = name || "Atanmamış";
    if (!map[key]) {
      map[key] = {
        name: key,
        examinations: 0,
        vaccines: 0,
        prescriptions: 0,
        revenue: 0,
        invoiceCount: 0,
        animals: new Set(),
        cancelledAppointments: 0,
        totalAppointments: 0,
      };
    }
    return map[key];
  };

  dataset.examinations.forEach((exam) => {
    if (!isDateInRange(exam.examinationDate, range.startDate, range.endDate)) {
      return;
    }
    if (!matchesVeterinarian(exam.veterinarian, user)) return;
    const row = ensure(exam.veterinarian?.trim() || "Atanmamış");
    row.examinations += 1;
    if (exam.animalId) row.animals.add(String(exam.animalId));
  });

  dataset.vaccines.forEach((vaccine) => {
    if (!isDateInRange(vaccine.applicationDate, range.startDate, range.endDate)) {
      return;
    }
    if (!matchesVeterinarian(vaccine.veterinarian, user)) return;
    const row = ensure(vaccine.veterinarian?.trim() || "Atanmamış");
    row.vaccines += 1;
    if (vaccine.animalId) row.animals.add(String(vaccine.animalId));
  });

  dataset.prescriptions.forEach((prescription) => {
    if (!isDateInRange(prescription.date, range.startDate, range.endDate)) {
      return;
    }
    if (!matchesVeterinarian(prescription.veterinarian, user)) return;
    const row = ensure(prescription.veterinarian?.trim() || "Atanmamış");
    row.prescriptions += 1;
    if (prescription.animalId) row.animals.add(String(prescription.animalId));
  });

  dataset.appointments.forEach((appointment) => {
    if (!isDateInRange(appointment.date, range.startDate, range.endDate)) {
      return;
    }
    if (!matchesVeterinarian(appointment.veterinarian, user)) return;
    const row = ensure(appointment.veterinarian?.trim() || "Atanmamış");
    row.totalAppointments += 1;
    if (appointment.status === "İptal") row.cancelledAppointments += 1;
    if (appointment.animalId) row.animals.add(String(appointment.animalId));
  });

  dataset.invoices.forEach((invoice) => {
    if (isInvoiceCancelled(invoice)) return;
    if (!isDateInRange(invoice.date, range.startDate, range.endDate)) return;

    const exam = dataset.examinations.find(
      (item) =>
        String(item.animalId) === String(invoice.animalId) &&
        item.examinationDate === invoice.date
    );
    const vetName = exam?.veterinarian?.trim() || "";
    if (!matchesVeterinarian(vetName, user)) return;

    const row = ensure(vetName || "Atanmamış");
    row.revenue += Number(invoice.total) || 0;
    row.invoiceCount += 1;
  });

  return Object.values(map)
    .map((row) => {
      const cancelRate =
        row.totalAppointments > 0
          ? round2((row.cancelledAppointments / row.totalAppointments) * 100)
          : 0;
      const avgInvoice =
        row.invoiceCount > 0 ? round2(row.revenue / row.invoiceCount) : 0;

      return {
        name: row.name,
        examinations: row.examinations,
        vaccines: row.vaccines,
        prescriptions: row.prescriptions,
        revenue: round2(row.revenue),
        avgInvoice,
        cancelRate,
        animalCount: row.animals.size,
        appointmentCount: row.totalAppointments,
      };
    })
    .sort((a, b) => b.revenue - a.revenue || b.examinations - a.examinations);
}

function computePatientAnalysis(dataset, range) {
  const speciesMap = {};
  const breedMap = {};
  const customerMap = {};

  const visitsInRange = dataset.appointments.filter(
    (appointment) =>
      appointment.status !== "İptal" &&
      isDateInRange(appointment.date, range.startDate, range.endDate)
  );

  visitsInRange.forEach((appointment) => {
    const animal = dataset.animals.find(
      (item) => String(item.id) === String(appointment.animalId)
    );

    const species = animal?.species || "Bilinmiyor";
    speciesMap[species] = (speciesMap[species] || 0) + 1;

    const breed = animal?.breed?.trim() || "Belirtilmemiş";
    breedMap[breed] = (breedMap[breed] || 0) + 1;

    if (appointment.ownerId) {
      const id = String(appointment.ownerId);
      if (!customerMap[id]) {
        customerMap[id] = {
          id,
          name: appointment.ownerName || "Bilinmeyen",
          visitCount: 0,
          firstVisit: appointment.date,
          lastVisit: appointment.date,
        };
      }
      customerMap[id].visitCount += 1;
      if (appointment.date < customerMap[id].firstVisit) {
        customerMap[id].firstVisit = appointment.date;
      }
      if (appointment.date > customerMap[id].lastVisit) {
        customerMap[id].lastVisit = appointment.date;
      }
    }
  });

  const customers = sortDesc(Object.values(customerMap), "visitCount");
  const repeatCustomers = customers.filter((c) => c.visitCount > 1);
  const firstVisitCustomers = customers.filter((c) => c.visitCount === 1);

  const allActiveAppointments = dataset.appointments.filter(
    (a) => a.status !== "İptal"
  );
  const cancelled = dataset.appointments.filter(
    (a) =>
      a.status === "İptal" &&
      isDateInRange(a.date, range.startDate, range.endDate)
  );
  const totalInRange = dataset.appointments.filter((a) =>
    isDateInRange(a.date, range.startDate, range.endDate)
  );

  const uniqueOwnersAll = new Set(
    allActiveAppointments.map((a) => String(a.ownerId)).filter(Boolean)
  );
  const repeatOwnersAll = new Set();
  const ownerVisitCounts = {};
  allActiveAppointments.forEach((a) => {
    if (!a.ownerId) return;
    const id = String(a.ownerId);
    ownerVisitCounts[id] = (ownerVisitCounts[id] || 0) + 1;
  });
  Object.entries(ownerVisitCounts).forEach(([id, count]) => {
    if (count > 1) repeatOwnersAll.add(id);
  });

  const repeatVisitRate =
    uniqueOwnersAll.size > 0
      ? round2((repeatOwnersAll.size / uniqueOwnersAll.size) * 100)
      : 0;

  const cancelRate =
    totalInRange.length > 0
      ? round2((cancelled.length / totalInRange.length) * 100)
      : 0;

  return {
    topSpecies: sortDesc(
      Object.entries(speciesMap).map(([name, count]) => ({ name, count })),
      "count"
    ).slice(0, 10),
    topBreeds: sortDesc(
      Object.entries(breedMap).map(([name, count]) => ({ name, count })),
      "count"
    ).slice(0, 10),
    topCustomers: customers.slice(0, 10),
    firstVisitCount: firstVisitCustomers.length,
    repeatVisitCount: repeatCustomers.length,
    mostActiveCustomer: customers[0] || null,
    repeatVisitRate,
    cancelRate,
    visitCount: visitsInRange.length,
  };
}

function computeVaccineAnalysis(dataset, range) {
  const today = toDateOnly(new Date());
  const inRange = dataset.vaccines.filter((vaccine) =>
    isDateInRange(
      vaccine.applicationDate || vaccine.nextDoseDate,
      range.startDate,
      range.endDate
    )
  );

  const byName = {};
  let completed = 0;
  let pending = 0;
  let overdue = 0;
  let cancelled = 0;

  inRange.forEach((vaccine) => {
    const name = vaccine.vaccineName?.trim() || "Bilinmeyen Aşı";
    byName[name] = (byName[name] || 0) + 1;

    const status = vaccine.status || "";
    if (status === "Tamamlandı") completed += 1;
    else if (status === "İptal") cancelled += 1;
    else if (
      vaccine.nextDoseDate &&
      vaccine.nextDoseDate < today &&
      status !== "Tamamlandı"
    ) {
      overdue += 1;
    } else {
      pending += 1;
    }
  });

  const total = inRange.length;
  const completionRate =
    total > 0 ? round2((completed / total) * 100) : 0;

  return {
    topVaccines: sortDesc(
      Object.entries(byName).map(([name, count]) => ({ name, count })),
      "count"
    ).slice(0, 10),
    completed,
    pending,
    overdue,
    cancelled,
    total,
    completionRate,
  };
}

function computePrescriptionAnalysis(dataset, range) {
  const inRange = dataset.prescriptions.filter((prescription) =>
    isDateInRange(prescription.date, range.startDate, range.endDate)
  );

  const medMap = {};
  let totalItems = 0;

  inRange.forEach((prescription) => {
    (prescription.items || []).forEach((item) => {
      const name = item.medicationName?.trim() || "Bilinmeyen";
      const qty = Number(item.quantity) || 1;
      if (!medMap[name]) {
        medMap[name] = { name, count: 0, quantity: 0 };
      }
      medMap[name].count += 1;
      medMap[name].quantity += qty;
      totalItems += qty;
    });
  });

  const medications = sortDesc(Object.values(medMap), "quantity");

  return {
    totalPrescriptions: inRange.length,
    avgItemCount:
      inRange.length > 0
        ? round2(
            inRange.reduce(
              (sum, p) => sum + (p.items?.length || 0),
              0
            ) / inRange.length
          )
        : 0,
    totalItems,
    topWritten: sortDesc(Object.values(medMap), "count").slice(0, 10),
    topUsed: medications.slice(0, 10),
  };
}

function computeStockAnalysis(dataset, range) {
  const outbound = filterMovementsByDate(
    dataset.movements,
    range.startDate,
    range.endDate
  ).filter(isOutboundMovement);

  const byProduct = {};
  const byLot = {};
  const bySupplier = {};

  outbound.forEach((movement) => {
    const name = movement.stockName || "Bilinmeyen";
    byProduct[name] = (byProduct[name] || 0) + (Number(movement.quantity) || 0);

    const stock = dataset.stock.find(
      (item) => String(item.id) === String(movement.stockId)
    );
    const lot = stock?.lotNo || movement.lotNo || "Lotsuz";
    const lotKey = `${name} · ${lot}`;
    byLot[lotKey] = (byLot[lotKey] || 0) + (Number(movement.quantity) || 0);

    const supplier = stock?.supplierName || stock?.supplier || "Belirtilmemiş";
    bySupplier[supplier] =
      (bySupplier[supplier] || 0) + (Number(movement.quantity) || 0);
  });

  const consumed = sortDesc(
    Object.entries(byProduct).map(([name, quantity]) => ({ name, quantity })),
    "quantity"
  );

  return {
    mostConsumed: consumed.slice(0, 10),
    leastConsumed: [...consumed].reverse().slice(0, 10),
    criticalStock: dataset.criticalStock.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      minQuantity: item.minQuantity,
    })),
    expiringStock: dataset.expiringStock.map((item) => ({
      name: item.name,
      expiryDate: item.expiryDate,
      quantity: item.quantity,
      lotNo: item.lotNo || "",
    })),
    byLot: sortDesc(
      Object.entries(byLot).map(([name, quantity]) => ({ name, quantity })),
      "quantity"
    ).slice(0, 10),
    bySupplier: sortDesc(
      Object.entries(bySupplier).map(([name, quantity]) => ({
        name,
        quantity,
      })),
      "quantity"
    ).slice(0, 10),
    totalConsumed: outbound.reduce(
      (sum, m) => sum + (Number(m.quantity) || 0),
      0
    ),
  };
}

function computeProfitability(dataset, range) {
  const services = rankInvoiceItemsByProfit(dataset.invoices, {
    ...range,
    types: ["Muayene", "Tedavi", "Aşı"],
    limit: 10,
  });
  const medicines = rankInvoiceItemsByProfit(dataset.invoices, {
    ...range,
    types: ["İlaç"],
    limit: 10,
  });
  const products = rankInvoiceItemsByProfit(dataset.invoices, {
    ...range,
    types: ["Ürün"],
    limit: 10,
  });
  const lowestMargin = rankInvoiceItemsByProfit(dataset.invoices, {
    ...range,
    limit: 50,
  })
    .filter((row) => row.sale > 0)
    .sort((a, b) => a.margin - b.margin)
    .slice(0, 10);

  return {
    topServices: services,
    topMedicines: medicines.length ? medicines : products,
    topProducts: products,
    lowestMargin,
  };
}

function computeOverview(dataset, range, finance) {
  const today = getPresetRange("today");

  return {
    customerCount: dataset.customers.length,
    animalCount: dataset.animals.length,
    examinationCount: dataset.examinations.filter((e) =>
      isDateInRange(e.examinationDate, range.startDate, range.endDate)
    ).length,
    appointmentCount: dataset.appointments.filter((a) =>
      isDateInRange(a.date, range.startDate, range.endDate)
    ).length,
    vaccineCount: dataset.vaccines.filter((v) =>
      isDateInRange(v.applicationDate, range.startDate, range.endDate)
    ).length,
    prescriptionCount: dataset.prescriptions.filter((p) =>
      isDateInRange(p.date, range.startDate, range.endDate)
    ).length,
    todayExaminations: dataset.examinations.filter(
      (e) => e.examinationDate === today.startDate
    ).length,
    todayAppointments: dataset.appointments.filter(
      (a) => a.date === today.startDate
    ).length,
    todayVaccines: dataset.vaccines.filter(
      (v) => v.nextDoseDate === today.startDate || v.applicationDate === today.startDate
    ).length,
    criticalStockCount: dataset.criticalStock.length,
    finance,
  };
}

/**
 * Saf hesaplama — React useMemo içinde kullanılabilir.
 */
export function computeBusinessIntelligence(dataset, range, options = {}) {
  const { user = null } = options;
  const finance = computeFinance(dataset, range);

  return {
    range,
    settings: dataset.settings,
    overview: computeOverview(dataset, range, finance),
    finance,
    monthlySeries: computeMonthlySeries(dataset, range),
    veterinarians: computeVeterinarianPerformance(dataset, range, user),
    patients: computePatientAnalysis(dataset, range),
    vaccines: computeVaccineAnalysis(dataset, range),
    prescriptions: computePrescriptionAnalysis(dataset, range),
    stock: computeStockAnalysis(dataset, range),
    profitability: computeProfitability(dataset, range),
  };
}

export async function getBusinessIntelligence(range, options = {}) {
  // Veri API veya LocalStorage'dan gelir; BI hesapları tek compute fonksiyonunda.
  const dataset = await fetchAnalyticsDataset();
  const report = computeBusinessIntelligence(dataset, range, options);

  // API raporları için günlük/aylık KPI kısa yolları
  report.todayFinance = computeBusinessIntelligence(
    dataset,
    getPresetRange("today"),
    options
  ).finance;
  report.monthFinance = computeBusinessIntelligence(
    dataset,
    getPresetRange("month"),
    options
  ).finance;

  return { dataset, report };
}

/**
 * Dashboard finans KPI'ları — Reports ile aynı hesaplama kaynağı.
 */
export async function getDashboardFinanceKpis() {
  if (USE_API) {
    return apiRequest("GET", "/analytics/dashboard-kpis");
  }

  const dataset = await fetchAnalyticsDataset();
  const today = getPresetRange("today");
  const month = getPresetRange("month");

  const todayFinance = computeFinance(dataset, today);
  const monthFinance = computeFinance(dataset, month);

  return {
    todayRevenue: todayFinance.totalRevenue,
    monthRevenue: monthFinance.totalRevenue,
    todayProfit: {
      sale: todayFinance.sale,
      cost: todayFinance.cost,
      profit: todayFinance.netProfit,
      margin: todayFinance.margin,
    },
    monthProfit: {
      sale: monthFinance.sale,
      cost: monthFinance.cost,
      profit: monthFinance.netProfit,
      margin: monthFinance.margin,
    },
    todayCollection: todayFinance.totalCollection,
    outstandingDebt: dataset.outstanding?.totalDebt || 0,
    outstanding: dataset.outstanding,
  };
}

/* -------------------- Backward-compatible helpers -------------------- */

export async function getRevenueBreakdown(range) {
  const invoices = await getInvoices();

  const filtered = invoices.filter(
    (invoice) =>
      !isInvoiceCancelled(invoice) &&
      isDateInRange(invoice.date, range?.startDate, range?.endDate)
  );

  const byDay = {};

  filtered.forEach((invoice) => {
    byDay[invoice.date] =
      (byDay[invoice.date] || 0) + (Number(invoice.total) || 0);
  });

  const series = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({
      date,
      amount: round2(amount),
    }));

  return {
    total: sumInvoiceRevenueInRange(invoices, range),
    invoiceCount: filtered.length,
    series,
  };
}

function groupInvoiceItemsByDescription(invoices, types) {
  const groups = {};

  invoices.forEach((invoice) => {
    (invoice.items || []).forEach((item) => {
      if (!types.includes(item.type)) return;

      const key = item.description?.trim() || item.type;

      if (!groups[key]) {
        groups[key] = { name: key, count: 0, quantity: 0, revenue: 0 };
      }

      groups[key].count += 1;
      groups[key].quantity += Number(item.quantity) || 0;
      groups[key].revenue += Number(item.subtotal) || 0;
    });
  });

  return Object.values(groups)
    .map((group) => ({
      ...group,
      revenue: round2(group.revenue),
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export async function getTopServices(range, limit = 5) {
  const invoices = await getInvoices();
  const filtered = invoices.filter(
    (invoice) =>
      !isInvoiceCancelled(invoice) &&
      isDateInRange(invoice.date, range?.startDate, range?.endDate)
  );
  return groupInvoiceItemsByDescription(filtered, ["Muayene", "Tedavi"]).slice(
    0,
    limit
  );
}

export async function getTopProducts(range, limit = 5) {
  const invoices = await getInvoices();
  const filtered = invoices.filter(
    (invoice) =>
      !isInvoiceCancelled(invoice) &&
      isDateInRange(invoice.date, range?.startDate, range?.endDate)
  );
  return groupInvoiceItemsByDescription(filtered, ["Ürün"]).slice(0, limit);
}

export async function getTopVaccines(range, limit = 5) {
  const vaccines = await getVaccines();
  const filtered = vaccines.filter((vaccine) =>
    isDateInRange(vaccine.applicationDate, range?.startDate, range?.endDate)
  );

  const counts = {};
  filtered.forEach((vaccine) => {
    const key = vaccine.vaccineName?.trim() || "Bilinmeyen Aşı";
    counts[key] = (counts[key] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function groupAppointmentsBy(appointments, idField, nameField) {
  const groups = {};

  appointments.forEach((appointment) => {
    const id = appointment[idField];
    if (!id) return;

    if (!groups[id]) {
      groups[id] = {
        id,
        name: appointment[nameField] || "Bilinmeyen",
        visitCount: 0,
      };
    }

    groups[id].visitCount += 1;
  });

  return Object.values(groups).sort((a, b) => b.visitCount - a.visitCount);
}

export async function getTopCustomers(range, limit = 5) {
  const appointments = await getAppointments();
  const filtered = appointments.filter(
    (appointment) =>
      appointment.status !== "İptal" &&
      isDateInRange(appointment.date, range?.startDate, range?.endDate)
  );
  return groupAppointmentsBy(filtered, "ownerId", "ownerName").slice(0, limit);
}

export async function getTopAnimals(range, limit = 5) {
  const appointments = await getAppointments();
  const filtered = appointments.filter(
    (appointment) =>
      appointment.status !== "İptal" &&
      isDateInRange(appointment.date, range?.startDate, range?.endDate)
  );
  return groupAppointmentsBy(filtered, "animalId", "animalName").slice(
    0,
    limit
  );
}

export async function getAverageDailyAppointments(range) {
  const appointments = await getAppointmentsByDateRange(
    range?.startDate,
    range?.endDate
  );
  const active = appointments.filter(
    (appointment) => appointment.status !== "İptal"
  );
  const days = getDayCount(range?.startDate, range?.endDate);
  return Math.round((active.length / days) * 10) / 10;
}

/** Rol bazlı rapor sekmeleri. */
export function getAllowedReportTabs(role) {
  if (role === ROLES.ADMIN) {
    return ["overview", "finance", "veterinarian", "patients", "stock", "vaccines"];
  }
  if (role === ROLES.VETERINARIAN) {
    return ["veterinarian"];
  }
  if (role === ROLES.RECEPTION) {
    return ["overview", "finance"];
  }
  return ["overview"];
}
