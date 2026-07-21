const asyncHandler = require("../middleware/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

/**
 * Verilen servisten standart CRUD (list/getById/create/update/remove)
 * Express handler'ları üretir. Sekiz modülün (customers, animals,
 * appointments, examinations, vaccines, stock, invoices, users) hepsi
 * bu fabrikayı kullanır; controller'larda tekrar eden req/res/try-catch
 * kalıbı tek bir yerde durur. Modüle özgü ek endpoint'ler (ör. login,
 * cascade ile ilgili özel uçlar) kendi controller dosyasında bu nesneye
 * eklenir.
 */
function createCrudController(service) {
  return {
    list: asyncHandler(async (req, res) => {
      const data = await service.list(req.query);
      sendSuccess(res, { data });
    }),

    getById: asyncHandler(async (req, res) => {
      const data = await service.getById(req.params.id);
      sendSuccess(res, { data });
    }),

    create: asyncHandler(async (req, res) => {
      const data = await service.create(req.body);
      sendSuccess(res, { statusCode: 201, data });
    }),

    update: asyncHandler(async (req, res) => {
      const data = await service.update(req.params.id, req.body);
      sendSuccess(res, { data });
    }),

    remove: asyncHandler(async (req, res) => {
      await service.remove(req.params.id);
      res.status(204).send();
    }),
  };
}

module.exports = createCrudController;
