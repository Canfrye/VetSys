/**
 * Rol tabanlı yetkilendirme — tek doğruluk kaynağı.
 *
 * ROUTE_PERMISSIONS burada tanımlanır; Sidebar (menü görünürlüğü) ve
 * App.jsx (route koruması) aynı haritayı kullanır, böylece "bir yolun
 * hangi rollere açık olduğu" bilgisi tek bir yerde yönetilir.
 */

export const ROLES = {
  ADMIN: "Admin",
  VETERINARIAN: "Veteriner",
  RECEPTION: "Resepsiyon",
};

export const ALL_ROLES = Object.values(ROLES);

/**
 * Varsayılan izin matrisi (klinik iş akışına göre öngörülen, ihtiyaca göre
 * kolayca güncellenebilir):
 * - Admin: her şeye erişebilir.
 * - Veteriner: klinik/tıbbi işlemler (muayene, aşı, stok) + hasta/randevu.
 * - Resepsiyon: müşteri/hayvan/randevu/fatura yönetimi; raporlarda finans
 *   özeti ve günlük istatistikler; tıbbi kayıtlara ve ayarlara erişemez.
 */
export const ROUTE_PERMISSIONS = {
  "/": ALL_ROLES,
  "/musteriler": ALL_ROLES,
  "/hayvanlar": ALL_ROLES,
  "/randevular": ALL_ROLES,
  "/hatirlatmalar": ALL_ROLES,
  "/aktivite": ALL_ROLES,
  "/muayeneler": [ROLES.ADMIN, ROLES.VETERINARIAN],
  "/asilar": [ROLES.ADMIN, ROLES.VETERINARIAN],
  "/stok": [ROLES.ADMIN, ROLES.VETERINARIAN],
  "/receteler": ALL_ROLES,
  "/faturalar": ALL_ROLES,
  "/finans": ALL_ROLES,
  "/raporlar": ALL_ROLES,
  "/ayarlar": [ROLES.ADMIN],
};

/** Reçete oluşturma / düzenleme — Admin + Veteriner. */
export const PRESCRIPTION_WRITE_ROLES = [ROLES.ADMIN, ROLES.VETERINARIAN];

/** Reçete silme — yalnızca Admin. */
export const PRESCRIPTION_DELETE_ROLES = [ROLES.ADMIN];

/** Fatura oluşturma / düzenleme / silme — Admin + Resepsiyon. */
export const INVOICE_WRITE_ROLES = [ROLES.ADMIN, ROLES.RECEPTION];

/** Ödeme alma — Admin + Resepsiyon. */
export const PAYMENT_WRITE_ROLES = [ROLES.ADMIN, ROLES.RECEPTION];

/** Ödeme silme — yalnızca Admin. */
export const PAYMENT_DELETE_ROLES = [ROLES.ADMIN];

export function getAllowedRoles(path) {
  return ROUTE_PERMISSIONS[path] || ALL_ROLES;
}

export function isRouteAllowedForRole(path, role) {
  const matchedKey = Object.keys(ROUTE_PERMISSIONS).find(
    (base) => path === base || path.startsWith(`${base}/`)
  );

  if (!matchedKey) return true;

  return ROUTE_PERMISSIONS[matchedKey].includes(role);
}
