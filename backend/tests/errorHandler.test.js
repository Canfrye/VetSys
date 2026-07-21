const AppError = require("../src/utils/AppError");
const { errorHandler, notFoundHandler } = require("../src/middleware/errorHandler");

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("errorHandler middleware", () => {
  it("AppError'ı statusCode ve mesajıyla birlikte olduğu gibi döner", () => {
    const res = mockRes();

    errorHandler(AppError.notFound("Müşteri"), {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: "NOT_FOUND" }),
      })
    );
  });

  it("Prisma P2002 (unique constraint) hatasını 409 CONFLICT'e çevirir", () => {
    const res = mockRes();
    const prismaError = { code: "P2002", meta: { target: ["microchipNo"] } };

    errorHandler(prismaError, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it("Prisma P2025 (kayıt yok) hatasını 404'e çevirir", () => {
    const res = mockRes();

    errorHandler({ code: "P2025" }, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("beklenmeyen hataları 500 olarak maskeler", () => {
    const res = mockRes();

    errorHandler(new Error("beklenmeyen sorun"), {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: "INTERNAL_ERROR" }),
      })
    );
  });
});

describe("notFoundHandler middleware", () => {
  it("404 AppError üreterek next'e iletir", () => {
    const next = jest.fn();

    notFoundHandler({ method: "GET", originalUrl: "/api/yok" }, {}, next);

    expect(next.mock.calls[0][0].statusCode).toBe(404);
  });
});
