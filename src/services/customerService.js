import { getAnimalsByOwner, deleteAnimal, syncOwnerName as syncAnimalOwnerName } from "./animalService";
import { syncOwnerName as syncAppointmentOwnerName, deleteAppointmentsByOwnerId } from "./appointmentService";
import { syncOwnerName as syncVaccineOwnerName, deleteVaccinesByOwnerId } from "./vaccineService";
import { syncOwnerName as syncExaminationOwnerName, deleteExaminationsByOwnerId } from "./examinationService";
import { syncOwnerName as syncInvoiceOwnerName, deleteInvoicesByOwnerId } from "./invoiceService";
import { syncOwnerName as syncPrescriptionOwnerName, deletePrescriptionsByOwnerId } from "./prescriptionService";
import { deletePaymentsByOwnerId } from "./paymentService";
import { STORAGE_KEYS } from "../utils/storage";
import apiClient from "./apiClient";
import { createAuditLog } from "./auditLogService";
import { AUDIT_ACTIONS, AUDIT_MODULES } from "../utils/auditLog";
import { USE_API } from "../config/api";

const RESOURCE = STORAGE_KEYS.CUSTOMERS;

/* -------------------- CRUD -------------------- */

export const getCustomers = async () => {
  const customers = await apiClient.getAll(RESOURCE);

  return [...customers].sort((a, b) =>
    a.ad.localeCompare(b.ad, "tr", { sensitivity: "base" })
  );
};

export const getCustomerById = (id) => apiClient.getById(RESOURCE, id);

export const addCustomer = async (customer) => {
  const saved = await apiClient.create(RESOURCE, {
    ad: customer.ad.trim(),
    soyad: customer.soyad.trim(),

    telefon: customer.telefon || "",
    email: customer.email || "",
    tcKimlik: customer.tcKimlik || "",
    adres: customer.adres || "",
    not: customer.not || "",
  });

  await createAuditLog({
    module: AUDIT_MODULES.CUSTOMER,
    action: AUDIT_ACTIONS.CREATE,
    description: `Müşteri oluşturuldu: ${saved.ad} ${saved.soyad}`,
    entityId: saved.id,
    ownerId: saved.id,
  });

  return saved;
};

export const updateCustomer = async (updatedCustomer) => {
  const saved = await apiClient.update(RESOURCE, updatedCustomer.id, {
    ...updatedCustomer,
    ad: (updatedCustomer.ad || "").trim(),
    soyad: (updatedCustomer.soyad || "").trim(),
  });

  if (!saved) return null;

  const ownerName = `${saved.ad} ${saved.soyad}`;

  await syncAnimalOwnerName(updatedCustomer.id, ownerName);
  await syncAppointmentOwnerName(updatedCustomer.id, ownerName);
  await syncVaccineOwnerName(updatedCustomer.id, ownerName);
  await syncExaminationOwnerName(updatedCustomer.id, ownerName);
  await syncInvoiceOwnerName(updatedCustomer.id, ownerName);
  await syncPrescriptionOwnerName(updatedCustomer.id, ownerName);

  await createAuditLog({
    module: AUDIT_MODULES.CUSTOMER,
    action: AUDIT_ACTIONS.UPDATE,
    description: `Müşteri güncellendi: ${ownerName}`,
    entityId: saved.id,
    ownerId: saved.id,
  });

  return saved;
};

export const deleteCustomer = async (id) => {
  const existing = await getCustomerById(id);

  if (!USE_API) {
    const animals = await getAnimalsByOwner(id);

    for (const animal of animals) {
      await deleteAnimal(animal.id);
    }

    await deleteAppointmentsByOwnerId(id);
    await deleteVaccinesByOwnerId(id);
    await deleteExaminationsByOwnerId(id);
    await deleteInvoicesByOwnerId(id);
    await deletePrescriptionsByOwnerId(id);
    await deletePaymentsByOwnerId(id);
  }

  await apiClient.remove(RESOURCE, id);

  await createAuditLog({
    module: AUDIT_MODULES.CUSTOMER,
    action: AUDIT_ACTIONS.DELETE,
    description: `Müşteri silindi: ${existing ? `${existing.ad} ${existing.soyad}` : id}`,
    entityId: id,
    ownerId: id,
  });
};

/* -------------------- Statistics -------------------- */

export const getCustomerCount = async () => {
  const customers = await apiClient.getAll(RESOURCE);
  return customers.length;
};

export const getLatestCustomers = async (limit = 5) => {
  const customers = await apiClient.getAll(RESOURCE);

  return [...customers]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
};
