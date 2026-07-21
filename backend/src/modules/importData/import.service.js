const prisma = require("../../prisma/client");
const { mapRoleFromFe } = require("../../utils/serialize");
const { hashPassword } = require("../../utils/password");

const STORAGE_TO_KEY = {
  vetsys_customers: "customers",
  vetsys_animals: "animals",
  vetsys_appointments: "appointments",
  vetsys_examinations: "examinations",
  vetsys_vaccines: "vaccines",
  vetsys_stock: "stock",
  vetsys_stock_movements: "stockMovements",
  vetsys_invoices: "invoices",
  vetsys_prescriptions: "prescriptions",
  vetsys_payments: "payments",
  vetsys_users: "users",
  vetsys_settings: "settings",
};

function normalizeBody(body = {}) {
  const out = {};
  for (const [key, value] of Object.entries(body)) {
    const mapped = STORAGE_TO_KEY[key] || key;
    out[mapped] = value;
  }
  return out;
}

function pickCustomer(c) {
  return {
    id: c.id,
    ad: c.ad || "",
    soyad: c.soyad || "",
    telefon: c.telefon || null,
    email: c.email || null,
    tcKimlik: c.tcKimlik || null,
    adres: c.adres || null,
    not: c.not || null,
  };
}

function pickAnimal(a) {
  return {
    id: a.id,
    name: a.name,
    species: a.species,
    breed: a.breed || null,
    gender: a.gender || null,
    birthDate: a.birthDate ? new Date(a.birthDate) : null,
    color: a.color || null,
    microchipNo: a.microchipNo || null,
    weight: a.weight != null ? String(a.weight) : null,
    passportNo: a.passportNo || null,
    neutered: Boolean(a.neutered),
    active: a.active !== false,
    note: a.note || null,
    ownerType: a.ownerType || "customer",
    otherOwnerName: a.otherOwnerName || a.ownerName || null,
    customerId: a.customerId || a.ownerId || null,
  };
}

class ImportService {
  async importLocalData(body) {
    const data = normalizeBody(body);

    const result = await prisma.$transaction(async (tx) => {
      // Wipe dependent tables first (FK order)
      await tx.prescriptionItem.deleteMany();
      await tx.prescription.deleteMany();
      await tx.payment.deleteMany();
      await tx.invoiceItem.deleteMany();
      await tx.invoice.deleteMany();
      await tx.stockMovement.deleteMany();
      await tx.examination.deleteMany();
      await tx.vaccine.deleteMany();
      await tx.appointment.deleteMany();
      await tx.animal.deleteMany();
      await tx.stock.deleteMany();
      await tx.customer.deleteMany();
      // Keep users unless provided — wipe only if backup has users
      if (Array.isArray(data.users) && data.users.length > 0) {
        await tx.user.deleteMany();
      }
      await tx.settings.deleteMany();

      const counts = {};

      if (Array.isArray(data.customers)) {
        for (const c of data.customers) {
          await tx.customer.create({ data: pickCustomer(c) });
        }
        counts.customers = data.customers.length;
      }

      if (Array.isArray(data.animals)) {
        for (const a of data.animals) {
          const payload = pickAnimal(a);
          // Skip invalid FK if customer missing and required-ish; allow null
          if (payload.customerId) {
            const exists = await tx.customer.findUnique({
              where: { id: payload.customerId },
            });
            if (!exists) payload.customerId = null;
          }
          await tx.animal.create({ data: payload });
        }
        counts.animals = data.animals.length;
      }

      if (Array.isArray(data.appointments)) {
        for (const row of data.appointments) {
          await tx.appointment.create({
            data: {
              id: row.id,
              date: row.date,
              time: row.time,
              duration: Number(row.duration) || 30,
              veterinarian: row.veterinarian || null,
              reason: row.reason || null,
              status: row.status || "Bekliyor",
              note: row.note || null,
              animalId: row.animalId,
              customerId: row.customerId || row.ownerId || null,
            },
          });
        }
        counts.appointments = data.appointments.length;
      }

      if (Array.isArray(data.examinations)) {
        for (const row of data.examinations) {
          await tx.examination.create({
            data: {
              id: row.id,
              species: row.species || null,
              veterinarian: row.veterinarian || null,
              examinationDate: row.examinationDate,
              examType: row.examType || null,
              fee: row.fee != null ? Number(row.fee) : null,
              complaint: row.complaint || null,
              generalCondition: row.generalCondition || null,
              diagnosis: row.diagnosis || null,
              findings: row.findings || null,
              treatment: row.treatment || null,
              temperature: row.temperature || null,
              pulse: row.pulse || null,
              respiration: row.respiration || null,
              height: row.height || null,
              weight: row.weight != null ? String(row.weight) : null,
              medicines: row.medicines || null,
              procedures: row.procedures || null,
              labResult: row.labResult || null,
              controlDate: row.controlDate || null,
              notes: row.notes || null,
              attachments: row.attachments || null,
              animalId: row.animalId,
              customerId: row.customerId || row.ownerId || null,
            },
          });
        }
        counts.examinations = data.examinations.length;
      }

      if (Array.isArray(data.vaccines)) {
        for (const row of data.vaccines) {
          await tx.vaccine.create({
            data: {
              id: row.id,
              vaccineName: row.vaccineName,
              brand: row.brand || null,
              batchNo: row.batchNo || null,
              dose: row.dose || null,
              applicationDate: row.applicationDate,
              nextDoseDate: row.nextDoseDate || null,
              fee: row.fee != null ? Number(row.fee) : null,
              veterinarian: row.veterinarian || null,
              notes: row.notes || null,
              status: row.status || null,
              animalId: row.animalId,
              customerId: row.customerId || row.ownerId || null,
            },
          });
        }
        counts.vaccines = data.vaccines.length;
      }

      if (Array.isArray(data.stock)) {
        for (const row of data.stock) {
          const minQty = Number(row.minQuantity ?? row.criticalLevel) || 0;
          await tx.stock.create({
            data: {
              id: row.id,
              name: row.name,
              category: row.category || null,
              quantity: Number(row.quantity) || 0,
              unit: row.unit || null,
              minQuantity: minQty,
              criticalLevel: Number(row.criticalLevel ?? minQty) || 0,
              price: Number(row.price ?? row.salePrice) || 0,
              purchasePrice: Number(row.purchasePrice) || 0,
              expiryDate: row.expiryDate || null,
              lotNo: row.lotNo || null,
              supplierName: row.supplierName || row.supplier || null,
              supplierPhone: row.supplierPhone || null,
              supplierEmail: row.supplierEmail || null,
              supplierNote: row.supplierNote || null,
            },
          });
        }
        counts.stock = data.stock.length;
      }

      if (Array.isArray(data.stockMovements)) {
        for (const row of data.stockMovements) {
          await tx.stockMovement.create({
            data: {
              id: row.id,
              type: row.type,
              quantity: Number(row.quantity) || 0,
              previousQuantity: Number(row.previousQuantity) || 0,
              newQuantity: Number(row.newQuantity) || 0,
              userName: row.userName || null,
              note: row.note || null,
              date: row.date,
              prescriptionId: row.prescriptionId || null,
              prescriptionNumber: row.prescriptionNumber || null,
              stockId: row.stockId,
              stockName: row.stockName || null,
            },
          });
        }
        counts.stockMovements = data.stockMovements.length;
      }

      if (Array.isArray(data.invoices)) {
        for (const row of data.invoices) {
          const items = (row.items || []).map((item) => ({
            id: item.id,
            type: item.type,
            description: item.description || null,
            unitPrice: Number(item.unitPrice) || 0,
            quantity: Number(item.quantity) || 1,
            purchasePrice: Number(item.purchasePrice) || 0,
            stockId: item.stockId || null,
            priceSource: item.priceSource || null,
            sourceRef: item.sourceRef || null,
            subtotal: Number(item.subtotal) || 0,
          }));

          await tx.invoice.create({
            data: {
              id: row.id,
              invoiceNumber: row.invoiceNumber,
              date: row.date,
              discountType: row.discountType || "none",
              discountValue: Number(row.discountValue) || 0,
              vatEnabled: Boolean(row.vatEnabled),
              vatRate: Number(row.vatRate) || 0,
              paymentStatus: row.paymentStatus || "",
              cancelled: Boolean(row.cancelled),
              note: row.note || null,
              subtotal: Number(row.subtotal) || 0,
              discountAmount: Number(row.discountAmount) || 0,
              vatAmount: Number(row.vatAmount) || 0,
              total: Number(row.total) || 0,
              animalId: row.animalId || null,
              customerId: row.customerId || row.ownerId || null,
              items: { create: items },
            },
          });
        }
        counts.invoices = data.invoices.length;
      }

      if (Array.isArray(data.prescriptions)) {
        for (const row of data.prescriptions) {
          const items = (row.items || []).map((item) => ({
            id: item.id,
            medicationName: item.medicationName,
            dose: item.dose || null,
            quantity: Number(item.quantity) || 1,
            frequency: item.frequency || null,
            duration: item.duration || null,
            instructions: item.instructions || null,
          }));

          await tx.prescription.create({
            data: {
              id: row.id,
              prescriptionNumber: row.prescriptionNumber,
              veterinarian: row.veterinarian || null,
              examinationId: row.examinationId || null,
              examinationDate: row.examinationDate || null,
              date: row.date,
              diagnosis: row.diagnosis || null,
              notes: row.notes || null,
              animalId: row.animalId || null,
              customerId: row.customerId || row.ownerId || null,
              items: { create: items },
            },
          });
        }
        counts.prescriptions = data.prescriptions.length;
      }

      if (Array.isArray(data.payments)) {
        for (const row of data.payments) {
          await tx.payment.create({
            data: {
              id: row.id,
              receiptNumber: row.receiptNumber,
              invoiceNumber: row.invoiceNumber || null,
              amount: Number(row.amount) || 0,
              method: row.method || "Nakit",
              date: row.date,
              note: row.note || null,
              invoiceId: row.invoiceId || null,
              animalId: row.animalId || null,
              customerId: row.customerId || row.ownerId || null,
            },
          });
        }
        counts.payments = data.payments.length;
      }

      if (data.settings && typeof data.settings === "object") {
        await tx.settings.create({
          data: { id: "default", data: data.settings },
        });
        counts.settings = 1;
      }

      if (Array.isArray(data.users) && data.users.length > 0) {
        for (const u of data.users) {
          const password = u.password?.startsWith("$2")
            ? u.password
            : await hashPassword(u.password || "changeme");
          await tx.user.create({
            data: {
              id: u.id,
              username: u.username,
              password,
              fullName: u.fullName || u.username,
              role: mapRoleFromFe(u.role) || "RECEPTION",
              active: u.active !== false,
            },
          });
        }
        counts.users = data.users.length;
      }

      return counts;
    });

    return { imported: true, counts: result };
  }
}

module.exports = new ImportService();
