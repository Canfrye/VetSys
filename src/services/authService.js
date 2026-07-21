/**
 * authService — LocalStorage mock veya gerçek JWT (VITE_USE_API).
 */

import apiClient, { generateId, apiRequest, USE_API } from "./apiClient";
import { STORAGE_KEYS, readJson, writeJson } from "../utils/storage";
import { ApiError } from "../utils/apiError";
import { ROLES } from "../utils/roles";

const RESOURCE = STORAGE_KEYS.USERS;

const DEFAULT_USERS = [
  {
    username: "admin",
    password: "admin123",
    fullName: "Sistem Yöneticisi",
    role: ROLES.ADMIN,
    active: true,
  },
  {
    username: "veteriner",
    password: "vet123",
    fullName: "Dr. Hasan Doğruyol",
    role: ROLES.VETERINARIAN,
    active: true,
  },
  {
    username: "resepsiyon",
    password: "resepsiyon123",
    fullName: "Resepsiyon Görevlisi",
    role: ROLES.RECEPTION,
    active: true,
  },
];

const nowIso = () => new Date().toISOString();

const ensureSeedUsers = async () => {
  if (USE_API) return [];

  const users = await apiClient.getAll(RESOURCE);

  if (users.length > 0) return users;

  const seeded = DEFAULT_USERS.map((user) => ({
    ...user,
    id: generateId(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }));

  writeJson(RESOURCE, seeded);

  return seeded;
};

const sanitizeUser = (user) => {
  if (!user) return null;

  const safeUser = { ...user };
  delete safeUser.password;

  return safeUser;
};

function persistSession(user, token) {
  writeJson(STORAGE_KEYS.SESSION, {
    userId: user.id,
    token,
    loginAt: nowIso(),
  });
}

export const login = async (username, password) => {
  if (USE_API) {
    const data = await apiRequest("POST", "/auth/login", {
      body: { username, password },
    });

    const user = sanitizeUser(data.user);
    persistSession(user, data.token);

    return { user, token: data.token };
  }

  const users = await ensureSeedUsers();

  const user = users.find(
    (u) =>
      u.username.trim().toLowerCase() ===
      String(username).trim().toLowerCase()
  );

  if (!user || user.password !== password) {
    throw new ApiError(
      "Kullanıcı adı veya şifre hatalı.",
      "INVALID_CREDENTIALS",
      RESOURCE,
      null,
      401
    );
  }

  if (!user.active) {
    throw new ApiError(
      "Bu kullanıcı hesabı devre dışı bırakılmış.",
      "USER_INACTIVE",
      RESOURCE,
      null,
      403
    );
  }

  const token = generateId();
  const safe = sanitizeUser(user);
  persistSession(safe, token);

  return { user: safe, token };
};

export const logout = () => {
  return Promise.resolve().then(() => {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  });
};

export const restoreSession = async () => {
  const session = readJson(STORAGE_KEYS.SESSION, null);

  if (!session?.token && !session?.userId) return null;

  if (USE_API) {
    if (!session?.token) return null;

    try {
      const user = await apiRequest("GET", "/auth/me");
      return sanitizeUser(user);
    } catch {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
      return null;
    }
  }

  if (!session?.userId) return null;

  await ensureSeedUsers();

  const user = await apiClient.getById(RESOURCE, session.userId);

  if (!user || !user.active) {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    return null;
  }

  return sanitizeUser(user);
};

export const getUsers = async () => {
  if (USE_API) {
    const users = await apiClient.getAll(RESOURCE);
    return users.map(sanitizeUser);
  }

  const users = await ensureSeedUsers();
  return users.map(sanitizeUser);
};
