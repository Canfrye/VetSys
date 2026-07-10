const STORAGE_KEY = "customers";

/* -------------------- Helpers -------------------- */

const read = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const write = (customers) => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(customers)
  );
};

/* -------------------- CRUD -------------------- */

export const getCustomers = () => {
  return [...read()].sort((a, b) =>
    a.ad.localeCompare(b.ad, "tr", {
      sensitivity: "base",
    })
  );
};

export const getCustomerById = (id) => {
  return read().find(
    (customer) => String(customer.id) === String(id)
  );
};

export const addCustomer = (customer) => {
  const customers = read();

  const newCustomer = {
    id: crypto.randomUUID(),

    ad: customer.ad.trim(),
    soyad: customer.soyad.trim(),

    telefon: customer.telefon || "",
    email: customer.email || "",
    tcKimlik: customer.tcKimlik || "",
    adres: customer.adres || "",
    not: customer.not || "",

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  customers.push(newCustomer);

  write(customers);

  return newCustomer;
};

export const updateCustomer = (updatedCustomer) => {
  const customers = read();

  const index = customers.findIndex(
    (c) => c.id === updatedCustomer.id
  );

  if (index === -1) return;

  customers[index] = {
    ...customers[index],
    ...updatedCustomer,
    updatedAt: new Date().toISOString(),
  };

  write(customers);
};

export const deleteCustomer = (id) => {
  write(
    read().filter(
      (customer) => customer.id !== id
    )
  );
};

/* -------------------- Statistics -------------------- */

export const getCustomerCount = () => {
  return read().length;
};

export const getLatestCustomers = (limit = 5) => {
  return [...read()]
    .sort(
      (a, b) =>
        new Date(b.createdAt) -
        new Date(a.createdAt)
    )
    .slice(0, limit);
};