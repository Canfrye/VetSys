/**
 * Geliştirme ortamı için varsayılan kullanıcıları oluşturur. Frontend'in
 * mock authService.js'indeki demo kullanıcılarla birebir aynıdır, böylece
 * backend'e geçişte giriş bilgileri değişmez.
 *
 * Çalıştırma: npm run prisma:seed
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const DEFAULT_USERS = [
  { username: "admin", password: "admin123", fullName: "Sistem Yöneticisi", role: "ADMIN" },
  { username: "veteriner", password: "vet123", fullName: "Dr. Hasan Doğruyol", role: "VETERINARIAN" },
  { username: "resepsiyon", password: "resepsiyon123", fullName: "Resepsiyon Görevlisi", role: "RECEPTION" },
];

async function main() {
  for (const user of DEFAULT_USERS) {
    const hashedPassword = await bcrypt.hash(user.password, 10);

    await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: { ...user, password: hashedPassword },
    });

    console.log(`[seed] Kullanıcı hazır: ${user.username} (${user.role})`);
  }
}

main()
  .catch((err) => {
    console.error("[seed] Hata:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
