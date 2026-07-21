const prisma = require("../../prisma/client");
const BaseRepository = require("../../common/BaseRepository");

const WITH_ITEMS = {
  include: {
    items: true,
    animal: true,
    customer: true,
  },
};

class InvoicesRepository extends BaseRepository {
  constructor() {
    super(prisma.invoice);
  }

  findAll(args = {}) {
    return this.model.findMany({ orderBy: { date: "desc" }, ...WITH_ITEMS, ...args });
  }

  findById(id) {
    return this.model.findUnique({ where: { id }, ...WITH_ITEMS });
  }

  findByAnimalId(animalId) {
    return this.model.findMany({
      where: { animalId },
      orderBy: { date: "desc" },
      ...WITH_ITEMS,
    });
  }

  create({ items, ...invoiceData }) {
    return this.model.create({
      data: { ...invoiceData, items: { create: items } },
      ...WITH_ITEMS,
    });
  }

  update(id, { items, ...invoiceData }) {
    return this.model.update({
      where: { id },
      data: {
        ...invoiceData,
        ...(items
          ? { items: { deleteMany: {}, create: items } }
          : {}),
      },
      ...WITH_ITEMS,
    });
  }
}

module.exports = new InvoicesRepository();
