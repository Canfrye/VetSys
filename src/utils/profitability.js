/**
 * Fatura satırı karlılık hesapları — alış / satış üzerinden.
 */

import { isInvoiceCancelled } from "./paymentUtils";
import { isDateInRange, getPresetRange } from "./dateRange";

const round2 = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export function getLineSale(item) {
  return round2(
    (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1)
  );
}

export function getLineCost(item) {
  return round2(
    (Number(item.purchasePrice) || 0) * (Number(item.quantity) || 1)
  );
}

export function getLineProfit(item) {
  return round2(getLineSale(item) - getLineCost(item));
}

export function sumInvoiceProfit(invoice) {
  if (isInvoiceCancelled(invoice)) {
    return { sale: 0, cost: 0, profit: 0 };
  }

  const items = invoice.items || [];
  const sale = round2(items.reduce((s, i) => s + getLineSale(i), 0));
  const cost = round2(items.reduce((s, i) => s + getLineCost(i), 0));

  return {
    sale,
    cost,
    profit: round2(sale - cost),
  };
}

export function aggregateProfitability(
  invoices = [],
  { startDate, endDate } = {}
) {
  let sale = 0;
  let cost = 0;

  invoices.forEach((invoice) => {
    if (isInvoiceCancelled(invoice)) return;
    if (!isDateInRange(invoice.date, startDate, endDate)) return;

    const row = sumInvoiceProfit(invoice);
    sale += row.sale;
    cost += row.cost;
  });

  sale = round2(sale);
  cost = round2(cost);
  const profit = round2(sale - cost);
  const margin = sale > 0 ? round2((profit / sale) * 100) : 0;

  return { sale, cost, profit, margin };
}

export function getTodayProfitability(invoices = []) {
  return aggregateProfitability(invoices, getPresetRange("today"));
}

export function getMonthProfitability(invoices = []) {
  return aggregateProfitability(invoices, getPresetRange("month"));
}

/**
 * Tip + açıklama bazlı gelir / maliyet / kar sıralaması.
 */
export function rankInvoiceItemsByProfit(
  invoices = [],
  { startDate, endDate, types = null, limit = 5 } = {}
) {
  const map = {};

  invoices.forEach((invoice) => {
    if (isInvoiceCancelled(invoice)) return;
    if (!isDateInRange(invoice.date, startDate, endDate)) return;

    (invoice.items || []).forEach((item) => {
      if (types && !types.includes(item.type)) return;

      const key = `${item.type}::${item.description || item.type}`;
      if (!map[key]) {
        map[key] = {
          name: item.description || item.type,
          type: item.type,
          sale: 0,
          cost: 0,
          profit: 0,
          quantity: 0,
        };
      }

      map[key].sale += getLineSale(item);
      map[key].cost += getLineCost(item);
      map[key].profit += getLineProfit(item);
      map[key].quantity += Number(item.quantity) || 0;
    });
  });

  return Object.values(map)
    .map((row) => ({
      ...row,
      sale: round2(row.sale),
      cost: round2(row.cost),
      profit: round2(row.profit),
      margin:
        row.sale > 0 ? round2((row.profit / row.sale) * 100) : 0,
    }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, limit);
}

export function rankInvoiceItemsByRevenue(
  invoices = [],
  { startDate, endDate, types = null, limit = 5 } = {}
) {
  const ranked = rankInvoiceItemsByProfit(invoices, {
    startDate,
    endDate,
    types,
    limit: 1000,
  });

  return ranked
    .sort((a, b) => b.sale - a.sale)
    .slice(0, limit);
}
