const request = require("supertest");
const createApp = require("../src/app");

const app = createApp();

describe("Sistem uçları", () => {
  it("GET /api/health -> 200 ve durum bilgisi döner", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("ok");
  });

  it("Tanımsız bir endpoint -> 404 + tutarlı hata zarfı döner", async () => {
    const res = await request(app).get("/api/bilinmeyen-endpoint");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("GET /api-docs.json -> geçerli bir OpenAPI dokümanı döner", async () => {
    const res = await request(app).get("/api-docs.json");

    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe("3.0.3");
    expect(res.body.paths).toHaveProperty("/api/customers");
  });
});
