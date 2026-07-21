/**
 * Zod şemasına göre request'i (body/query/params) doğrulayan generic
 * middleware fabrikası. Her modül kendi zod şemasını tanımlar; bu
 * middleware doğrulama+hata fırlatma tekrarını tek yerde toplar.
 *
 * Doğrulanan/temizlenen (default değerler uygulanmış, tip dönüşümü
 * yapılmış) veri req[part]'a geri yazılır, böylece controller'lar her
 * zaman güvenilir, normalize edilmiş veriyle çalışır.
 */
function validate(schema, part = "body") {
  return function validateMiddleware(req, res, next) {
    const result = schema.safeParse(req[part]);

    if (!result.success) {
      const error = new Error("Girdi doğrulama hatası.");
      error.name = "ZodError";
      error.issues = result.error.issues;

      return next(error);
    }

    req[part] = result.data;

    return next();
  };
}

module.exports = validate;
