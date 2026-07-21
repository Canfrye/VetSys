const { calculateInvoiceTotals } = require("../src/utils/invoiceCalc");

describe("calculateInvoiceTotals (frontend ile aynı hesaplama mantığı)", () => {
  it("indirim/KDV olmadan basit toplamı doğru hesaplar", () => {
    const totals = calculateInvoiceTotals({
      items: [
        { unitPrice: 200, quantity: 1 },
        { unitPrice: 150, quantity: 2 },
      ],
    });

    expect(totals.subtotal).toBe(500);
    expect(totals.discountAmount).toBe(0);
    expect(totals.vatAmount).toBe(0);
    expect(totals.total).toBe(500);
  });

  it("yüzde indirim ve KDV'yi doğru uygular", () => {
    const totals = calculateInvoiceTotals({
      items: [{ unitPrice: 1000, quantity: 1 }],
      discountType: "percent",
      discountValue: 10,
      vatEnabled: true,
      vatRate: 20,
    });

    expect(totals.subtotal).toBe(1000);
    expect(totals.discountAmount).toBe(100);
    expect(totals.vatAmount).toBe(180); // (1000-100) * 0.20
    expect(totals.total).toBe(1080);
  });

  it("indirim tutarını subtotal ile sınırlar (negatif toplam olmaz)", () => {
    const totals = calculateInvoiceTotals({
      items: [{ unitPrice: 100, quantity: 1 }],
      discountType: "amount",
      discountValue: 500,
    });

    expect(totals.discountAmount).toBe(100);
    expect(totals.total).toBe(0);
  });
});
