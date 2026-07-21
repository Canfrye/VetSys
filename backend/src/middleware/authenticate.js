const AppError = require("../utils/AppError");
const { verifyToken } = require("../utils/jwt");

/**
 * Authorization: Bearer <token> header'ını doğrular ve JWT payload'ını
 * req.user'a yazar. Token yoksa/geçersizse/süresi dolmuşsa 401 döner.
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(AppError.unauthorized("Erişim token'ı bulunamadı."));
  }

  try {
    req.user = verifyToken(token);
    return next();
  } catch {
    return next(AppError.unauthorized("Erişim token'ı geçersiz veya süresi dolmuş."));
  }
}

module.exports = authenticate;
