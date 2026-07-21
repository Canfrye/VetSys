/**
 * Uygulama genelinde kullanılan, HTTP durum koduna sahip özel hata sınıfı.
 * Global error handler bu sınıfı "beklenen/operasyonel" hata olarak
 * tanır ve istemciye güvenli, tutarlı bir mesaj döner. Beklenmeyen (kod)
 * hataları ise 500 olarak maskeler.
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = "INTERNAL_ERROR", details = null) {
    super(message);

    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static notFound(resource = "Kayıt") {
    return new AppError(`${resource} bulunamadı.`, 404, "NOT_FOUND");
  }

  static badRequest(message, details = null) {
    return new AppError(message, 400, "BAD_REQUEST", details);
  }

  static unauthorized(message = "Kimlik doğrulama gerekli.") {
    return new AppError(message, 401, "UNAUTHORIZED");
  }

  static forbidden(message = "Bu işlem için yetkiniz yok.") {
    return new AppError(message, 403, "FORBIDDEN");
  }

  static conflict(message) {
    return new AppError(message, 409, "CONFLICT");
  }
}

module.exports = AppError;
