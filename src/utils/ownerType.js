/**
 * Hayvan sahip tipi — müşteri / sahipsiz / kurumsal sahiplik.
 * Yeni storage key yok; alan hayvan kaydında tutulur.
 */

export const OWNER_TYPE = {
  CUSTOMER: "Müşteriye Ait",
  OWNERLESS: "Sahipsiz",
  SHELTER: "Barınak",
  MUNICIPALITY: "Belediye",
  OTHER: "Diğer",
};

export const OWNER_TYPE_OPTIONS = [
  OWNER_TYPE.CUSTOMER,
  OWNER_TYPE.OWNERLESS,
  OWNER_TYPE.SHELTER,
  OWNER_TYPE.MUNICIPALITY,
  OWNER_TYPE.OTHER,
];

export const OWNER_TYPE_FILTER_OPTIONS = [
  { value: "all", label: "Tümü" },
  { value: OWNER_TYPE.CUSTOMER, label: "Sahipli" },
  { value: OWNER_TYPE.OWNERLESS, label: "Sahipsiz" },
  { value: OWNER_TYPE.SHELTER, label: "Barınak" },
  { value: OWNER_TYPE.MUNICIPALITY, label: "Belediye" },
  { value: OWNER_TYPE.OTHER, label: "Diğer" },
];

export function normalizeOwnerType(value) {
  const raw = String(value || "").trim();
  if (OWNER_TYPE_OPTIONS.includes(raw)) return raw;
  return OWNER_TYPE.CUSTOMER;
}

export function requiresCustomerOwner(ownerType) {
  return normalizeOwnerType(ownerType) === OWNER_TYPE.CUSTOMER;
}

export function hidesCustomerPicker(ownerType) {
  return !requiresCustomerOwner(ownerType);
}

/**
 * Sahip tipi + form alanlarından ownerId / ownerName üretir.
 */
export function resolveAnimalOwnerFields({
  ownerType,
  ownerId,
  ownerName,
  otherOwnerName,
} = {}) {
  const type = normalizeOwnerType(ownerType);

  if (type === OWNER_TYPE.CUSTOMER) {
    return {
      ownerType: type,
      ownerId: ownerId || null,
      ownerName: String(ownerName || "").trim(),
    };
  }

  if (type === OWNER_TYPE.OTHER) {
    const name = String(otherOwnerName || ownerName || "").trim() || OWNER_TYPE.OTHER;
    return {
      ownerType: type,
      ownerId: null,
      ownerName: name,
    };
  }

  return {
    ownerType: type,
    ownerId: null,
    ownerName: type,
  };
}

/**
 * Liste / kart / arama için görünen sahip adı.
 */
export function getAnimalOwnerDisplay(animal, customer = null) {
  const type = normalizeOwnerType(animal?.ownerType);

  if (type === OWNER_TYPE.CUSTOMER) {
    if (customer) {
      return `${customer.ad || ""} ${customer.soyad || ""}`.trim() || "-";
    }
    return animal?.ownerName || "-";
  }

  return animal?.ownerName || type;
}

export function matchesOwnerTypeFilter(animal, filterValue) {
  if (!filterValue || filterValue === "all") return true;

  const type = normalizeOwnerType(animal?.ownerType);

  if (filterValue === OWNER_TYPE.CUSTOMER || filterValue === "Sahipli") {
    return type === OWNER_TYPE.CUSTOMER;
  }

  return type === filterValue;
}

export function isOwnerlessAnimal(animal) {
  return normalizeOwnerType(animal?.ownerType) === OWNER_TYPE.OWNERLESS;
}
