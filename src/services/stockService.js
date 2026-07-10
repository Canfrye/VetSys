const STORAGE_KEY = "vetsys_stock";

const read = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const write = (items) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

const generateId = () => {
  if (crypto.randomUUID) return crypto.randomUUID();

  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2)
  );
};

export function getStock() {
  return read().sort((a, b) =>
    a.name.localeCompare(b.name, "tr")
  );
}

export function getStockById(id) {
  return read().find((i) => i.id === id);
}

export function addStock(item) {
  const items = read();

  const newItem = {
    id: generateId(),

    name: item.name.trim(),

    category: item.category,

    quantity: Number(item.quantity),

    minQuantity: Number(item.minQuantity),

    unit: item.unit,

    expiryDate: item.expiryDate,

    supplier: item.supplier || "",

    note: item.note || "",

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  items.push(newItem);

  write(items);

  return newItem;
}

export function updateStock(item) {
  const items = read();

  const index = items.findIndex(
    (i) => i.id === item.id
  );

  if (index === -1) return null;

  items[index] = {
    ...items[index],
    ...item,
    updatedAt: new Date().toISOString(),
  };

  write(items);

  return items[index];
}

export function deleteStock(id) {
  write(read().filter((i) => i.id !== id));
}

export function getCriticalStock() {
  return getStock().filter(
    (i) => i.quantity <= i.minQuantity
  );
}

export function getExpiredStock() {
  const today = new Date()
    .toISOString()
    .substring(0, 10);

  return getStock().filter(
    (i) => i.expiryDate && i.expiryDate < today
  );
}

export function getStockCount() {
  return read().length;
}