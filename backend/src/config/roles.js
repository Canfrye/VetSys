/**
 * Rol tanımları — Prisma şemasındaki Role enum'u ile birebir aynı
 * değerlere sahip olmalıdır. Frontend'deki src/utils/roles.js ile
 * kavramsal olarak eşleşir (Admin/Veteriner/Resepsiyon); backend'e
 * geçişte JWT claim'lerinde ve authorize middleware'inde bu sabitler
 * kullanılır.
 */
const ROLES = {
  ADMIN: "ADMIN",
  VETERINARIAN: "VETERINARIAN",
  RECEPTION: "RECEPTION",
};

const ALL_ROLES = Object.values(ROLES);

module.exports = { ROLES, ALL_ROLES };
