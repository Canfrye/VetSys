const AppError = require("../src/utils/AppError");
const authenticate = require("../src/middleware/authenticate");
const authorize = require("../src/middleware/authorize");
const { signToken } = require("../src/utils/jwt");
const { ROLES } = require("../src/config/roles");

function mockRes() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn() };
}

describe("authenticate middleware", () => {
  it("Authorization header yoksa 401 (UNAUTHORIZED) ile next(err) çağırır", () => {
    const req = { headers: {} };
    const next = jest.fn();

    authenticate(req, mockRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
  });

  it("Geçersiz token ile 401 döner", () => {
    const req = { headers: { authorization: "Bearer gecersiz-token" } };
    const next = jest.fn();

    authenticate(req, mockRes(), next);

    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });

  it("Geçerli token ile req.user set edilir ve next() hatasız çağırılır", () => {
    const token = signToken({ sub: "user-1", role: ROLES.ADMIN });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const next = jest.fn();

    authenticate(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user.sub).toBe("user-1");
    expect(req.user.role).toBe(ROLES.ADMIN);
  });
});

describe("authorize middleware (RBAC)", () => {
  it("req.user yoksa 401 döner", () => {
    const req = {};
    const next = jest.fn();

    authorize([ROLES.ADMIN])(req, mockRes(), next);

    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });

  it("izin verilmeyen rol için 403 döner", () => {
    const req = { user: { role: ROLES.RECEPTION } };
    const next = jest.fn();

    authorize([ROLES.ADMIN, ROLES.VETERINARIAN])(req, mockRes(), next);

    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });

  it("izin verilen rol için next() hatasız çağırılır", () => {
    const req = { user: { role: ROLES.VETERINARIAN } };
    const next = jest.fn();

    authorize([ROLES.ADMIN, ROLES.VETERINARIAN])(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith();
  });

  it("rol listesi verilmezse sadece giriş yapmış olmak yeterlidir", () => {
    const req = { user: { role: ROLES.RECEPTION } };
    const next = jest.fn();

    authorize()(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith();
  });
});
