/**
 * Tüm başarılı yanıtlar için tutarlı zarf (envelope) yapısı.
 * Frontend'in ileride gerçek backend'e bağlanacağı Sprint'te tahmin
 * edilebilir bir sözleşme (contract) sağlar.
 */
function sendSuccess(res, { statusCode = 200, data = null, meta = null } = {}) {
  const body = { success: true, data };

  if (meta) {
    body.meta = meta;
  }

  return res.status(statusCode).json(body);
}

module.exports = { sendSuccess };
