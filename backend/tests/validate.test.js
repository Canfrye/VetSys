const { z } = require("zod");
const validate = require("../src/middleware/validate");

function mockRes() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn() };
}

describe("validate middleware", () => {
  const schema = z.object({ name: z.string().min(2), age: z.coerce.number().int().optional() });

  it("geçersiz veri için ZodError adında bir hata ile next(err) çağırır", () => {
    const req = { body: { name: "a" } };
    const next = jest.fn();

    validate(schema)(req, mockRes(), next);

    const err = next.mock.calls[0][0];
    expect(err.name).toBe("ZodError");
    expect(err.issues.length).toBeGreaterThan(0);
  });

  it("geçerli veriyi normalize ederek req[part]'a geri yazar ve next() çağırır", () => {
    const req = { body: { name: "Ahmet", age: "5" } };
    const next = jest.fn();

    validate(schema)(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body.age).toBe(5); // coerce ile number'a çevrildi
  });
});
