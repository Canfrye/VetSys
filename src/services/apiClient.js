/**
 * apiClient — LocalStorage veya HTTP (VITE_USE_API) tek giriş noktası.
 */

import { readJson, writeJson, STORAGE_KEYS } from "../utils/storage";
import { ApiError } from "../utils/apiError";
import { USE_API, API_BASE_URL, API_TIMEOUT_MS } from "../config/api";

export const generateId = () => {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 9)
  );
};

const nowIso = () => new Date().toISOString();

const toAsync = (fn) => Promise.resolve().then(fn);

/** STORAGE_KEYS → REST path */
const RESOURCE_PATHS = {
  [STORAGE_KEYS.CUSTOMERS]: "/customers",
  [STORAGE_KEYS.ANIMALS]: "/animals",
  [STORAGE_KEYS.APPOINTMENTS]: "/appointments",
  [STORAGE_KEYS.EXAMINATIONS]: "/examinations",
  [STORAGE_KEYS.VACCINES]: "/vaccines",
  [STORAGE_KEYS.STOCK]: "/stock",
  [STORAGE_KEYS.STOCK_MOVEMENTS]: "/stock-movements",
  [STORAGE_KEYS.INVOICES]: "/invoices",
  [STORAGE_KEYS.PRESCRIPTIONS]: "/prescriptions",
  [STORAGE_KEYS.PAYMENTS]: "/payments",
  [STORAGE_KEYS.USERS]: "/users",
  [STORAGE_KEYS.SETTINGS]: "/settings",
};

function getAuthToken() {
  const session = readJson(STORAGE_KEYS.SESSION, null);
  return session?.token || "";
}

function emitUnauthorized() {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
  window.dispatchEvent(new Event("vetsys-unauthorized"));
}

async function httpRequest(method, path, { body, retry = false } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  const headers = {
    Accept: "application/json",
  };

  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (response.status === 204) {
      return null;
    }

    let payload = null;
    const text = await response.text();
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = null;
      }
    }

    if (!response.ok) {
      if (response.status === 401) {
        emitUnauthorized();
      }

      const message =
        payload?.error?.message ||
        payload?.message ||
        `İstek başarısız (${response.status})`;

      throw new ApiError(
        message,
        payload?.error?.code || `HTTP_${response.status}`,
        path,
        null,
        response.status,
        payload?.error?.details || null
      );
    }

    if (payload && typeof payload === "object" && "success" in payload) {
      return payload.data;
    }

    return payload;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    if (error?.name === "AbortError") {
      throw new ApiError("İstek zaman aşımına uğradı.", "TIMEOUT", path);
    }

    if (!retry && method === "GET") {
      return httpRequest(method, path, { body, retry: true });
    }

    throw ApiError.fromError(error, "NETWORK_ERROR", path);
  } finally {
    clearTimeout(timer);
  }
}

function resourcePath(resourceKey) {
  const path = RESOURCE_PATHS[resourceKey];
  if (!path) {
    throw new ApiError(
      `Bilinmeyen kaynak: ${resourceKey}`,
      "UNKNOWN_RESOURCE",
      resourceKey
    );
  }
  return path;
}

/** FE → API gövde dönüşümü */
function toApiPayload(resourceKey, data = {}) {
  if (!data || typeof data !== "object") return data;

  const payload = { ...data };

  if (
    resourceKey === STORAGE_KEYS.ANIMALS ||
    resourceKey === STORAGE_KEYS.APPOINTMENTS ||
    resourceKey === STORAGE_KEYS.EXAMINATIONS ||
    resourceKey === STORAGE_KEYS.VACCINES ||
    resourceKey === STORAGE_KEYS.INVOICES ||
    resourceKey === STORAGE_KEYS.PRESCRIPTIONS ||
    resourceKey === STORAGE_KEYS.PAYMENTS
  ) {
    if (payload.ownerId != null && payload.customerId == null) {
      payload.customerId = payload.ownerId || null;
    }
  }

  if (resourceKey === STORAGE_KEYS.STOCK) {
    if (payload.minQuantity != null && payload.criticalLevel == null) {
      payload.criticalLevel = Number(payload.minQuantity) || 0;
    }
    if (payload.supplier && !payload.supplierName) {
      payload.supplierName = payload.supplier;
    }
  }

  delete payload.ownerName;
  delete payload.animalName;

  return payload;
}

const localClient = {
  getAll(resourceKey, fallback = []) {
    return toAsync(() => {
      try {
        return readJson(resourceKey, fallback);
      } catch (error) {
        throw ApiError.fromError(error, "READ_FAILED", resourceKey);
      }
    });
  },

  async getById(resourceKey, id) {
    const list = await this.getAll(resourceKey);
    return list.find((item) => String(item.id) === String(id)) || null;
  },

  create(resourceKey, data) {
    return toAsync(() => {
      try {
        const list = readJson(resourceKey, []);
        const record = {
          ...data,
          id: generateId(),
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        list.push(record);
        writeJson(resourceKey, list);
        return record;
      } catch (error) {
        throw ApiError.fromError(error, "CREATE_FAILED", resourceKey);
      }
    });
  },

  update(resourceKey, id, data) {
    return toAsync(() => {
      try {
        const list = readJson(resourceKey, []);
        const index = list.findIndex((item) => String(item.id) === String(id));
        if (index === -1) return null;

        list[index] = {
          ...list[index],
          ...data,
          id: list[index].id,
          updatedAt: nowIso(),
        };
        writeJson(resourceKey, list);
        return list[index];
      } catch (error) {
        throw ApiError.fromError(error, "UPDATE_FAILED", resourceKey);
      }
    });
  },

  remove(resourceKey, id) {
    return toAsync(() => {
      try {
        const list = readJson(resourceKey, []);
        writeJson(
          resourceKey,
          list.filter((item) => String(item.id) !== String(id))
        );
        return true;
      } catch (error) {
        throw ApiError.fromError(error, "DELETE_FAILED", resourceKey);
      }
    });
  },

  removeWhere(resourceKey, predicate) {
    return toAsync(() => {
      try {
        const list = readJson(resourceKey, []);
        writeJson(
          resourceKey,
          list.filter((item) => !predicate(item))
        );
        return true;
      } catch (error) {
        throw ApiError.fromError(error, "DELETE_FAILED", resourceKey);
      }
    });
  },

  updateWhere(resourceKey, predicate, updater) {
    return toAsync(() => {
      try {
        const list = readJson(resourceKey, []);
        const next = list.map((item) =>
          predicate(item)
            ? { ...item, ...updater(item), updatedAt: nowIso() }
            : item
        );
        writeJson(resourceKey, next);
        return next;
      } catch (error) {
        throw ApiError.fromError(error, "UPDATE_FAILED", resourceKey);
      }
    });
  },
};

const httpClient = {
  async getAll(resourceKey) {
    if (resourceKey === STORAGE_KEYS.SETTINGS) {
      const data = await httpRequest("GET", "/settings");
      return data || {};
    }
    const data = await httpRequest("GET", resourcePath(resourceKey));
    return Array.isArray(data) ? data : [];
  },

  async getById(resourceKey, id) {
    if (resourceKey === STORAGE_KEYS.SETTINGS) {
      return this.getAll(resourceKey);
    }
    try {
      return await httpRequest("GET", `${resourcePath(resourceKey)}/${id}`);
    } catch (error) {
      if (error?.status === 404 || error?.code === "NOT_FOUND") return null;
      throw error;
    }
  },

  async create(resourceKey, data) {
    if (resourceKey === STORAGE_KEYS.SETTINGS) {
      return httpRequest("PUT", "/settings", { body: data });
    }
    return httpRequest("POST", resourcePath(resourceKey), {
      body: toApiPayload(resourceKey, data),
    });
  },

  async update(resourceKey, id, data) {
    if (resourceKey === STORAGE_KEYS.SETTINGS) {
      return httpRequest("PUT", "/settings", { body: data });
    }
    return httpRequest("PUT", `${resourcePath(resourceKey)}/${id}`, {
      body: toApiPayload(resourceKey, data),
    });
  },

  async remove(resourceKey, id) {
    await httpRequest("DELETE", `${resourcePath(resourceKey)}/${id}`);
    return true;
  },

  async removeWhere(resourceKey, predicate) {
    const list = await this.getAll(resourceKey);
    const targets = list.filter(predicate);
    for (const item of targets) {
      await this.remove(resourceKey, item.id);
    }
    return true;
  },

  async updateWhere(resourceKey, predicate, updater) {
    const list = await this.getAll(resourceKey);
    const next = [];
    for (const item of list) {
      if (predicate(item)) {
        const patch = updater(item);
        const saved = await this.update(resourceKey, item.id, {
          ...item,
          ...patch,
        });
        next.push(saved || { ...item, ...patch });
      } else {
        next.push(item);
      }
    }
    return next;
  },
};

/** Ham HTTP (auth, search, analytics, import) — sayfalar kullanmaz */
export async function apiRequest(method, path, options = {}) {
  if (!USE_API) {
    throw new ApiError(
      "API modu kapalı (VITE_USE_API=false).",
      "API_DISABLED",
      path
    );
  }
  return httpRequest(method, path, options);
}

const apiClient = USE_API ? httpClient : localClient;

export default apiClient;
export { USE_API, httpRequest };
