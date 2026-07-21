export class ApiError extends Error {
  constructor(
    message,
    code = "UNKNOWN_ERROR",
    resource = null,
    cause = null,
    status = null,
    details = null
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.resource = resource;
    this.cause = cause;
    this.status = status;
    this.details = details;
  }

  static fromError(error, code = "UNKNOWN_ERROR", resource = null) {
    if (error instanceof ApiError) return error;

    return new ApiError(
      error?.message || "Beklenmeyen bir hata oluştu.",
      code,
      resource,
      error,
      error?.status || null
    );
  }
}

export function isApiError(error) {
  return error instanceof ApiError;
}

export function getErrorMessage(error, fallback = "Beklenmeyen bir hata oluştu.") {
  if (isApiError(error)) return error.message || fallback;
  return error?.message || fallback;
}

/** HTTP / iş kuralı kodlarını kullanıcı mesajına çevirir. */
export function normalizeApiErrorMessage(error) {
  if (!error) return "Beklenmeyen bir hata oluştu.";

  const status =
    error.status || Number(String(error.code || "").replace("HTTP_", ""));
  const message = getErrorMessage(error);

  switch (status) {
    case 401:
      return message || "Oturum süreniz doldu. Lütfen tekrar giriş yapın.";
    case 403:
      return message || "Bu işlem için yetkiniz yok.";
    case 404:
      return message || "Kayıt bulunamadı.";
    case 422:
      return message || "Gönderilen veri geçersiz.";
    case 500:
      return message || "Sunucu hatası oluştu.";
    default:
      return message;
  }
}
