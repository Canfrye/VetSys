/**
 * Async route handler/middleware sarmalayıcı. Her controller'da tekrar
 * eden try/catch bloklarını ortadan kaldırır; fırlatılan/reject edilen
 * hatalar otomatik olarak Express'in error handler zincirine (next(err))
 * iletilir.
 */
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
