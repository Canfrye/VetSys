const prisma = require("../../prisma/client");
const { ROLES } = require("../../config/roles");
const {
  serializeAnimal,
  serializeWithOwner,
  serializeInvoice,
  serializePrescription,
  serializeStock,
} = require("../../utils/serialize");

const round2 = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

function inRange(dateStr, startDate, endDate) {
  if (!dateStr) return false;
  if (startDate && dateStr < startDate) return false;
  if (endDate && dateStr > endDate) return false;
  return true;
}

class AnalyticsService {
  async getReport({ startDate, endDate }, userRole) {
    const [
      invoices,
      payments,
      customers,
      animals,
      appointments,
      examinations,
      vaccines,
      prescriptions,
      stock,
    ] = await Promise.all([
      prisma.invoice.findMany({ include: { items: true } }),
      prisma.payment.findMany(),
      prisma.customer.count(),
      prisma.animal.count(),
      prisma.appointment.findMany(),
      prisma.examination.findMany(),
      prisma.vaccine.findMany(),
      prisma.prescription.findMany(),
      prisma.stock.findMany(),
    ]);

    const activeInvoices = invoices.filter(
      (inv) =>
        !inv.cancelled &&
        inv.paymentStatus !== "İptal" &&
        inRange(inv.date, startDate, endDate)
    );

    const rangePayments = payments.filter((p) =>
      inRange(p.date, startDate, endDate)
    );

    const totalRevenue = round2(
      activeInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0)
    );
    const totalCollection = round2(
      rangePayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    );

    const finance = {
      totalRevenue,
      totalCollection,
      invoiceCount: activeInvoices.length,
      paymentCount: rangePayments.length,
      pendingCollection: 0,
      outstandingDebt: 0,
      netProfit: totalRevenue,
      avgInvoice:
        activeInvoices.length > 0
          ? round2(totalRevenue / activeInvoices.length)
          : 0,
    };

    const overview = {
      customerCount: customers,
      animalCount: animals,
      examinationCount: examinations.filter((e) =>
        inRange(e.examinationDate, startDate, endDate)
      ).length,
      appointmentCount: appointments.filter((a) =>
        inRange(a.date, startDate, endDate)
      ).length,
      vaccineCount: vaccines.filter((v) =>
        inRange(v.applicationDate, startDate, endDate)
      ).length,
      prescriptionCount: prescriptions.filter((p) =>
        inRange(p.date, startDate, endDate)
      ).length,
      criticalStockCount: stock.filter(
        (s) => (Number(s.quantity) || 0) <= (Number(s.minQuantity) || 0)
      ).length,
      finance,
    };

    const report = {
      range: { startDate: startDate || "", endDate: endDate || "" },
      overview,
      finance,
    };

    // Non-admin roles get a useful but limited payload
    if (userRole && userRole !== ROLES.ADMIN) {
      return {
        range: report.range,
        overview: {
          customerCount: overview.customerCount,
          animalCount: overview.animalCount,
          examinationCount: overview.examinationCount,
          appointmentCount: overview.appointmentCount,
          vaccineCount: overview.vaccineCount,
          prescriptionCount: overview.prescriptionCount,
          finance:
            userRole === ROLES.RECEPTION
              ? finance
              : {
                  invoiceCount: finance.invoiceCount,
                  totalRevenue: 0,
                  totalCollection: 0,
                },
        },
        finance:
          userRole === ROLES.RECEPTION
            ? finance
            : {
                invoiceCount: finance.invoiceCount,
                totalRevenue: 0,
                totalCollection: 0,
              },
      };
    }

    return report;
  }

  async getDashboardKpis() {
    const today = new Date().toISOString().slice(0, 10);
    const monthStart = `${today.slice(0, 7)}-01`;

    const todayReport = await this.getReport(
      { startDate: today, endDate: today },
      ROLES.ADMIN
    );
    const monthReport = await this.getReport(
      { startDate: monthStart, endDate: today },
      ROLES.ADMIN
    );

    return {
      todayRevenue: todayReport.finance.totalRevenue,
      monthRevenue: monthReport.finance.totalRevenue,
      todayCollection: todayReport.finance.totalCollection,
      outstandingDebt: 0,
      outstanding: {
        totalDebt: 0,
        items: [],
        customerCount: 0,
        invoiceCount: 0,
      },
      todayProfit: {
        sale: todayReport.finance.totalRevenue,
        cost: 0,
        profit: todayReport.finance.totalRevenue,
        margin: todayReport.finance.totalRevenue > 0 ? 100 : 0,
      },
      monthProfit: {
        sale: monthReport.finance.totalRevenue,
        cost: 0,
        profit: monthReport.finance.totalRevenue,
        margin: monthReport.finance.totalRevenue > 0 ? 100 : 0,
      },
    };
  }

  async getDataset() {
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
      settings,
    ] = await Promise.all([
      prisma.invoice.findMany({
        include: { items: true, animal: true, customer: true },
      }),
      prisma.payment.findMany({
        include: { animal: true, customer: true },
      }),
      prisma.appointment.findMany({
        include: { animal: true, customer: true },
      }),
      prisma.examination.findMany({
        include: { animal: true, customer: true },
      }),
      prisma.vaccine.findMany({
        include: { animal: true, customer: true },
      }),
      prisma.prescription.findMany({
        include: { items: true, animal: true, customer: true },
      }),
      prisma.animal.findMany({ include: { customer: true } }),
      prisma.customer.findMany(),
      prisma.stock.findMany(),
      prisma.stockMovement.findMany(),
      prisma.settings.findUnique({ where: { id: "default" } }),
    ]);

    const stockList = stock.map(serializeStock);

    return {
      invoices: invoices.map(serializeInvoice),
      payments: payments.map(serializeWithOwner),
      appointments: appointments.map(serializeWithOwner),
      examinations: examinations.map(serializeWithOwner),
      vaccines: vaccines.map(serializeWithOwner),
      prescriptions: prescriptions.map(serializePrescription),
      animals: animals.map(serializeAnimal),
      customers,
      stock: stockList,
      movements,
      criticalStock: stockList.filter(
        (s) => (Number(s.quantity) || 0) <= (Number(s.minQuantity) || 0)
      ),
      expiringStock: [],
      outstanding: { totalDebt: 0, items: [], customerCount: 0, invoiceCount: 0 },
      settings: settings?.data || {},
    };
  }
}

module.exports = new AnalyticsService();
