const AppError = require("../utils/AppError");

/**
 * Rol tabanlı yetkilendirme middleware fabrikası. `authenticate`'ten
 * SONRA kullanılmalıdır (req.user'a ihtiyaç duyar). Frontend'deki
 * ROUTE_PERMISSIONS mantığının backend karşılığıdır: her route kendi
 * izin verilen rol listesini bildirir.
 *
 * authorize() (parametresiz) çağrısı sadece giriş yapmış olmayı yeterli
 * sayar; authorize(["ADMIN"]) gibi bir liste verilirse sadece o roller
 * geçebilir.
 */
function authorize(allowedRoles = []) {
  return function authorizeMiddleware(req, res, next) {
    if (!req.user) {
      return next(AppError.unauthorized());
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return next(AppError.forbidden());
    }

    return next();
  };
}

module.exports = authorize;
