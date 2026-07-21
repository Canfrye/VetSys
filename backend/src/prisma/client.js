const { PrismaClient } = require("@prisma/client");

const env = require("../config/env");

/**
 * PrismaClient tekil (singleton) örneği. Node'un modül cache'i sayesinde
 * bu dosyayı require eden her modül aynı instance'ı paylaşır — dev modunda
 * nodemon ile sık yeniden yükleme sırasında bağlantı havuzunun şişmesini
 * önler.
 */
const prisma = new PrismaClient({
  log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

module.exports = prisma;
