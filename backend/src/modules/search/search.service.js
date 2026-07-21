const prisma = require("../../prisma/client");
const { customerName } = require("../../utils/serialize");

function includesText(haystack, q) {
  return String(haystack || "")
    .toLocaleLowerCase("tr")
    .includes(q);
}

class SearchService {
  async search(query) {
    const q = String(query || "")
      .trim()
      .toLocaleLowerCase("tr");

    if (!q) return [];

    const results = [];

    const [customers, animals, invoices, prescriptions, payments] =
      await Promise.all([
        prisma.customer.findMany({ take: 200 }),
        prisma.animal.findMany({ include: { customer: true }, take: 200 }),
        prisma.invoice.findMany({
          include: { items: true, animal: true, customer: true },
          take: 200,
        }),
        prisma.prescription.findMany({
          include: { items: true, animal: true, customer: true },
          take: 200,
        }),
        prisma.payment.findMany({
          include: { animal: true, customer: true },
          take: 200,
        }),
      ]);

    for (const customer of customers) {
      const fullName = `${customer.ad || ""} ${customer.soyad || ""}`.trim();
      if (includesText(fullName, q) || includesText(customer.telefon, q)) {
        results.push({
          id: customer.id,
          type: "customer",
          title: fullName,
          subtitle: customer.telefon || "",
        });
      }
    }

    for (const animal of animals) {
      const ownerName =
        animal.ownerType === "other"
          ? animal.otherOwnerName || ""
          : customerName(animal.customer);
      if (
        includesText(animal.name, q) ||
        includesText(animal.microchipNo, q) ||
        includesText(ownerName, q)
      ) {
        results.push({
          id: animal.id,
          type: "animal",
          title: animal.name,
          subtitle: ownerName || animal.ownerType || "",
        });
      }
    }

    for (const invoice of invoices) {
      const ownerName = customerName(invoice.customer);
      const animalName = invoice.animal?.name || "";
      const itemText = (invoice.items || [])
        .map((item) => `${item.description || ""} ${item.type || ""}`)
        .join(" ");
      const haystack = [
        invoice.invoiceNumber,
        animalName,
        ownerName,
        itemText,
      ].join(" ");

      if (includesText(haystack, q)) {
        results.push({
          id: invoice.id,
          type: "invoice",
          title: invoice.invoiceNumber || "Fatura",
          subtitle: `${ownerName || "-"} · ${animalName || "-"}`,
        });
      }
    }

    for (const prescription of prescriptions) {
      const ownerName = customerName(prescription.customer);
      const animalName = prescription.animal?.name || "";
      const medText = (prescription.items || [])
        .map((item) => item.medicationName || "")
        .join(" ");
      const haystack = [
        prescription.prescriptionNumber,
        animalName,
        ownerName,
        prescription.veterinarian,
        prescription.diagnosis,
        medText,
      ].join(" ");

      if (includesText(haystack, q)) {
        results.push({
          id: prescription.id,
          type: "prescription",
          title: prescription.prescriptionNumber || "Reçete",
          subtitle: `${animalName || "-"} · ${prescription.diagnosis || "Tanı yok"}`,
        });
      }
    }

    for (const payment of payments) {
      const ownerName = customerName(payment.customer);
      const haystack = [
        payment.receiptNumber,
        payment.invoiceNumber,
        payment.animal?.name,
        ownerName,
      ].join(" ");

      if (includesText(haystack, q)) {
        results.push({
          id: payment.id,
          type: "payment",
          title: payment.receiptNumber || "Makbuz",
          subtitle: `${ownerName || "-"} · ${payment.invoiceNumber || "-"}`,
        });
      }
    }

    return results;
  }
}

module.exports = new SearchService();
