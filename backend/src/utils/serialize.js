/**
 * FE uyumlu serialize — ownerId/ownerName/animalName alanlarını ekler.
 * Backend Role → Frontend rol etiketleri.
 */

const ROLE_TO_FE = {
  ADMIN: "Admin",
  VETERINARIAN: "Veteriner",
  RECEPTION: "Resepsiyon",
};

const ROLE_FROM_FE = {
  Admin: "ADMIN",
  Veteriner: "VETERINARIAN",
  Resepsiyon: "RECEPTION",
};

function customerName(customer) {
  if (!customer) return "";
  return `${customer.ad || ""} ${customer.soyad || ""}`.trim();
}

function mapRoleToFe(role) {
  return ROLE_TO_FE[role] || role;
}

function mapRoleFromFe(role) {
  return ROLE_FROM_FE[role] || role;
}

function serializeUser(user) {
  if (!user) return null;
  const { password, ...rest } = user;
  return {
    ...rest,
    role: mapRoleToFe(user.role),
  };
}

function serializeAnimal(animal) {
  if (!animal) return null;
  return {
    ...animal,
    birthDate: animal.birthDate
      ? new Date(animal.birthDate).toISOString().slice(0, 10)
      : "",
    ownerId: animal.customerId || null,
    ownerName:
      animal.ownerType === "other"
        ? animal.otherOwnerName || ""
        : customerName(animal.customer) || animal.otherOwnerName || "",
    customerId: animal.customerId || null,
  };
}

function serializeWithOwner(record) {
  if (!record) return null;
  return {
    ...record,
    ownerId: record.customerId || null,
    ownerName: customerName(record.customer),
    animalName: record.animal?.name || record.animalName || "",
    customerId: record.customerId || null,
  };
}

function serializeInvoice(invoice) {
  if (!invoice) return null;
  const base = serializeWithOwner(invoice);
  return {
    ...base,
    items: (invoice.items || []).map((item) => ({
      ...item,
      purchasePrice: item.purchasePrice ?? 0,
    })),
  };
}

function serializePrescription(prescription) {
  if (!prescription) return null;
  return {
    ...serializeWithOwner(prescription),
    items: prescription.items || [],
  };
}

function serializeStock(stock) {
  if (!stock) return null;
  return {
    ...stock,
    minQuantity: stock.minQuantity ?? stock.criticalLevel ?? 0,
    criticalLevel: stock.criticalLevel ?? stock.minQuantity ?? 0,
    supplier: stock.supplierName || "",
    supplierName: stock.supplierName || "",
  };
}

function resolveCustomerId(payload = {}) {
  return payload.customerId || payload.ownerId || null;
}

module.exports = {
  ROLE_TO_FE,
  ROLE_FROM_FE,
  mapRoleToFe,
  mapRoleFromFe,
  customerName,
  serializeUser,
  serializeAnimal,
  serializeWithOwner,
  serializeInvoice,
  serializePrescription,
  serializeStock,
  resolveCustomerId,
};
