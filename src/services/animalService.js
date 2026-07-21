import {
  deleteAppointmentsByAnimalId,
  syncAnimalName as syncAppointmentAnimalName,
  syncOwnerForAnimal as syncAppointmentOwnerForAnimal,
} from "./appointmentService";

import {
  deleteVaccinesByAnimalId,
  syncAnimalName as syncVaccineAnimalName,
  syncOwnerForAnimal as syncVaccineOwnerForAnimal,
} from "./vaccineService";

import {
  deleteExaminationsByAnimalId,
  syncAnimalName as syncExaminationAnimalName,
  syncOwnerForAnimal as syncExaminationOwnerForAnimal,
} from "./examinationService";

import {
  deleteInvoicesByAnimalId,
  syncAnimalName as syncInvoiceAnimalName,
  syncOwnerForAnimal as syncInvoiceOwnerForAnimal,
} from "./invoiceService";

import {
  deletePrescriptionsByAnimalId,
  syncAnimalName as syncPrescriptionAnimalName,
  syncOwnerForAnimal as syncPrescriptionOwnerForAnimal,
} from "./prescriptionService";

import { deletePaymentsByAnimalId } from "./paymentService";

import { STORAGE_KEYS } from "../utils/storage";
import apiClient from "./apiClient";
import {
  normalizeOwnerType,
  OWNER_TYPE,
  resolveAnimalOwnerFields,
  isOwnerlessAnimal,
} from "../utils/ownerType";
import { createAuditLog } from "./auditLogService";
import { AUDIT_ACTIONS, AUDIT_MODULES } from "../utils/auditLog";
import { USE_API } from "../config/api";

const RESOURCE = STORAGE_KEYS.ANIMALS;

const getOwnerName = async (ownerId) => {
  if (!ownerId) return "";

  const customers = await apiClient.getAll(STORAGE_KEYS.CUSTOMERS);

  const owner = customers.find(
    (customer) => String(customer.id) === String(ownerId)
  );

  return owner ? `${owner.ad} ${owner.soyad}` : "";
};

function buildOwnerPayload(animal) {
  const resolved = resolveAnimalOwnerFields({
    ownerType: animal.ownerType,
    ownerId: animal.ownerId,
    ownerName: animal.ownerName,
    otherOwnerName: animal.otherOwnerName || animal.ownerName,
  });

  return {
    ownerType: resolved.ownerType,
    ownerId:
      resolved.ownerType === OWNER_TYPE.CUSTOMER
        ? resolved.ownerId || animal.ownerId || null
        : null,
    ownerName: resolved.ownerName,
  };
}

/* -------------------- CRUD -------------------- */

export const getAnimals = async () => {
  const animals = await apiClient.getAll(RESOURCE);

  return [...animals]
    .map((animal) => ({
      ...animal,
      ownerType: normalizeOwnerType(animal.ownerType),
    }))
    .sort((a, b) =>
      a.name.localeCompare(b.name, "tr", { sensitivity: "base" })
    );
};

export const getAnimalById = async (id) => {
  const animal = await apiClient.getById(RESOURCE, id);
  if (!animal) return null;
  return {
    ...animal,
    ownerType: normalizeOwnerType(animal.ownerType),
  };
};

export const addAnimal = async (animal) => {
  const ownerFields = buildOwnerPayload(animal);

  let ownerName = ownerFields.ownerName;
  if (ownerFields.ownerType === OWNER_TYPE.CUSTOMER) {
    ownerName =
      ownerName || (await getOwnerName(ownerFields.ownerId)) || "";
  }

  const saved = await apiClient.create(RESOURCE, {
    ...ownerFields,
    ownerName,

    name: animal.name.trim(),

    species: animal.species,

    breed: animal.breed || "",

    gender: animal.gender || "",

    birthDate: animal.birthDate || "",

    color: animal.color || "",

    microchipNo: (animal.microchipNo || "").trim(),

    passportNo: (animal.passportNo || "").trim(),

    weight: animal.weight || "",

    neutered: Boolean(animal.neutered),

    active: animal.active !== false,

    note: animal.note || "",
  });

  await createAuditLog({
    module: AUDIT_MODULES.ANIMAL,
    action: AUDIT_ACTIONS.CREATE,
    description: `Hayvan oluşturuldu: ${saved.name}`,
    entityId: saved.id,
    animalId: saved.id,
    ownerId: saved.ownerId || "",
  });

  return {
    ...saved,
    ownerType: normalizeOwnerType(saved.ownerType),
  };
};

export const updateAnimal = async (updatedAnimal) => {
  const previous = await getAnimalById(updatedAnimal.id);

  if (!previous) return null;

  const ownerFields = buildOwnerPayload({
    ...previous,
    ...updatedAnimal,
  });

  let ownerName = ownerFields.ownerName;
  if (ownerFields.ownerType === OWNER_TYPE.CUSTOMER) {
    ownerName =
      ownerName ||
      (await getOwnerName(ownerFields.ownerId || previous.ownerId)) ||
      "";
  }

  const saved = await apiClient.update(RESOURCE, updatedAnimal.id, {
    ...updatedAnimal,
    ...ownerFields,
    ownerName,
  });

  if (!saved) return null;

  if (previous.name !== saved.name) {
    await syncAppointmentAnimalName(updatedAnimal.id, saved.name);
    await syncVaccineAnimalName(updatedAnimal.id, saved.name);
    await syncExaminationAnimalName(updatedAnimal.id, saved.name);
    await syncInvoiceAnimalName(updatedAnimal.id, saved.name);
    await syncPrescriptionAnimalName(updatedAnimal.id, saved.name);
  }

  if (String(previous.ownerId || "") !== String(saved.ownerId || "")) {
    await syncAppointmentOwnerForAnimal(
      updatedAnimal.id,
      saved.ownerId,
      saved.ownerName
    );
    await syncVaccineOwnerForAnimal(
      updatedAnimal.id,
      saved.ownerId,
      saved.ownerName
    );
    await syncExaminationOwnerForAnimal(
      updatedAnimal.id,
      saved.ownerId,
      saved.ownerName
    );
    await syncInvoiceOwnerForAnimal(
      updatedAnimal.id,
      saved.ownerId,
      saved.ownerName
    );
    await syncPrescriptionOwnerForAnimal(
      updatedAnimal.id,
      saved.ownerId,
      saved.ownerName
    );
  }

  await createAuditLog({
    module: AUDIT_MODULES.ANIMAL,
    action: AUDIT_ACTIONS.UPDATE,
    description: `Hayvan güncellendi: ${saved.name}`,
    entityId: saved.id,
    animalId: saved.id,
    ownerId: saved.ownerId || "",
  });

  return {
    ...saved,
    ownerType: normalizeOwnerType(saved.ownerType),
  };
};

export const deleteAnimal = async (id) => {
  const existing = await getAnimalById(id);

  // API modunda cascade PostgreSQL tarafında (onDelete: Cascade).
  if (!USE_API) {
    await deleteAppointmentsByAnimalId(id);
    await deleteVaccinesByAnimalId(id);
    await deleteExaminationsByAnimalId(id);
    await deleteInvoicesByAnimalId(id);
    await deletePrescriptionsByAnimalId(id);
    await deletePaymentsByAnimalId(id);
  }

  await apiClient.remove(RESOURCE, id);

  await createAuditLog({
    module: AUDIT_MODULES.ANIMAL,
    action: AUDIT_ACTIONS.DELETE,
    description: `Hayvan silindi: ${existing?.name || id}`,
    entityId: id,
    animalId: id,
    ownerId: existing?.ownerId || "",
  });
};

export const syncOwnerName = (ownerId, ownerName) => {
  return apiClient.updateWhere(
    RESOURCE,
    (animal) => String(animal.ownerId) === String(ownerId),
    () => ({ ownerName })
  );
};

export const searchAnimals = async (searchText = "") => {
  const text = searchText.toLowerCase().trim();

  const animals = await getAnimals();

  if (!text) return animals;

  return animals.filter((animal) => {
    return (
      (animal.name || "").toLowerCase().includes(text) ||
      (animal.ownerName || "").toLowerCase().includes(text) ||
      (animal.ownerType || "").toLowerCase().includes(text) ||
      (animal.species || "").toLowerCase().includes(text) ||
      (animal.breed || "").toLowerCase().includes(text) ||
      (animal.microchipNo || "").toLowerCase().includes(text)
    );
  });
};

export const isMicrochipExists = async (microchipNo, currentId = null) => {
  if (!microchipNo) return false;

  const animals = await apiClient.getAll(RESOURCE);

  return animals.some(
    (animal) =>
      animal.microchipNo === microchipNo &&
      String(animal.id) !== String(currentId)
  );
};

export const getAnimalsByOwner = async (ownerId) => {
  const animals = await getAnimals();

  return animals.filter(
    (animal) => String(animal.ownerId) === String(ownerId)
  );
};

export const getAnimalCount = async () => {
  const animals = await apiClient.getAll(RESOURCE);
  return animals.length;
};

export const getOwnerlessAnimalCount = async () => {
  const animals = await getAnimals();
  return animals.filter(isOwnerlessAnimal).length;
};

export const getLatestAnimals = async (limit = 5) => {
  const animals = await apiClient.getAll(RESOURCE);

  return [...animals]
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    )
    .slice(0, limit);
};

export const getAnimalsBySpecies = async (species) => {
  const animals = await getAnimals();

  return animals.filter(
    (animal) => animal.species?.toLowerCase() === species?.toLowerCase()
  );
};

export const getSpeciesStatistics = async () => {
  const animals = await getAnimals();

  const stats = {};

  animals.forEach((animal) => {
    const key = animal.species || "Bilinmiyor";

    stats[key] = (stats[key] || 0) + 1;
  });

  return Object.entries(stats).map(([name, value]) => ({
    name,
    value,
  }));
};

export const getAnimalsCreatedByMonth = async () => {
  const months = [
    "Oca", "Şub", "Mar", "Nis", "May", "Haz",
    "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
  ];

  const result = months.map((month) => ({
    month,
    count: 0,
  }));

  const animals = await getAnimals();

  animals.forEach((animal) => {
    if (!animal.createdAt) return;

    const date = new Date(animal.createdAt);

    result[date.getMonth()].count++;
  });

  return result;
};
