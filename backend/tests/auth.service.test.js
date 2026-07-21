jest.mock("../src/modules/users/users.repository", () => ({
  findByUsername: jest.fn(),
  findById: jest.fn(),
}));

const usersRepository = require("../src/modules/users/users.repository");
const { hashPassword } = require("../src/utils/password");
const { verifyToken } = require("../src/utils/jwt");
const authService = require("../src/modules/auth/auth.service");

describe("authService.login (Prisma mock ile, DB gerektirmez)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("doğru kullanıcı adı/şifre ile geçerli bir JWT ve kullanıcı döner", async () => {
    const hashed = await hashPassword("admin123");

    usersRepository.findByUsername.mockResolvedValue({
      id: "u1",
      username: "admin",
      password: hashed,
      fullName: "Sistem Yöneticisi",
      role: "ADMIN",
      active: true,
    });

    const result = await authService.login("admin", "admin123");

    expect(result.user).not.toHaveProperty("password");
    expect(result.user.username).toBe("admin");

    const decoded = verifyToken(result.token);
    expect(decoded.sub).toBe("u1");
    expect(decoded.role).toBe("ADMIN");
  });

  it("yanlış şifre ile 401 (UNAUTHORIZED) fırlatır", async () => {
    const hashed = await hashPassword("dogru-sifre");

    usersRepository.findByUsername.mockResolvedValue({
      id: "u1",
      username: "admin",
      password: hashed,
      role: "ADMIN",
      active: true,
    });

    await expect(authService.login("admin", "yanlis-sifre")).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("kullanıcı bulunamazsa 401 fırlatır (kullanıcı adının var olduğunu ifşa etmez)", async () => {
    usersRepository.findByUsername.mockResolvedValue(null);

    await expect(authService.login("yok-boyle-biri", "sifre")).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("devre dışı kullanıcı için 403 (FORBIDDEN) fırlatır", async () => {
    const hashed = await hashPassword("sifre123");

    usersRepository.findByUsername.mockResolvedValue({
      id: "u2",
      username: "pasif",
      password: hashed,
      role: "RECEPTION",
      active: false,
    });

    await expect(authService.login("pasif", "sifre123")).rejects.toMatchObject({
      statusCode: 403,
    });
  });
});
