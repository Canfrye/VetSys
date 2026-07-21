const AppError = require("../utils/AppError");

/**
 * Prisma'nın bilinen hata kodlarını (P2002 unique constraint, P2025 kayıt
 * bulunamadı, P2003 foreign key vb.) kullanıcıya anlamlı, tutarlı bir
 * AppError'a çevirir. Bu sayede controller/service katmanları Prisma'ya
 * özgü hata kodlarıyla ilgilenmek zorunda kalmaz.
 */
function normalizePrismaError(err) {
  if (err.code === "P2002") {
    const target = Array.isArray(err.meta?.target)
      ? err.meta.target.join(", ")
      : err.meta?.target;

    return AppError.conflict(
      `Bu değer zaten kullanılıyor${target ? ` (${target})` : ""}.`
    );
  }

  if (err.code === "P2025") {
    return AppError.notFound("Kayıt");
  }

  if (err.code === "P2003") {
    return AppError.badRequest(
      "İlişkili kayıt bulunamadı veya bu kayıt başka verilerle ilişkili olduğu için işlem yapılamadı."
    );
  }

  return null;
}

/**
 * Express global error handler — zincirin en sonunda tanımlanmalıdır.
 * Beklenen (AppError/isOperational) hatalar istemciye güvenle iletilir;
 * beklenmeyen hatalar loglanır ve 500 olarak maskelenir (stack trace
 * production'da asla dışarı verilmez).
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let error = err;

  if (error?.code?.toString().startsWith("P2")) {
    error = normalizePrismaError(error) || error;
  }

  if (error?.name === "ZodError") {
    error = AppError.badRequest("Girdi doğrulama hatası.", error.issues ?? error.errors);
  }

  if (!(error instanceof AppError)) {
    console.error("[VetSys API] Beklenmeyen hata:", error);

    error = new AppError(
      "Sunucu tarafında beklenmeyen bir hata oluştu.",
      500,
      "INTERNAL_ERROR"
    );
  }

  const response = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
    },
  };

  if (error.details) {
    response.error.details = error.details;
  }

  if (process.env.NODE_ENV === "development" && err.stack && error.statusCode === 500) {
    response.error.stack = err.stack;
  }

  res.status(error.statusCode || 500).json(response);
}

function notFoundHandler(req, res, next) {
  next(AppError.notFound(`Endpoint (${req.method} ${req.originalUrl})`));
}

module.exports = { errorHandler, notFoundHandler };
