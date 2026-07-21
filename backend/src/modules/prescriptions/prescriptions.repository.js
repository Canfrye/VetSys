const prisma = require("../../prisma/client");
const BaseRepository = require("../../common/BaseRepository");

const WITH_RELATIONS = {
  include: {
    items: true,
    animal: true,
    customer: true,
  },
};

class PrescriptionsRepository extends BaseRepository {
  constructor() {
    super(prisma.prescription);
  }

  findAll(args = {}) {
    return this.model.findMany({
      orderBy: { date: "desc" },
      ...WITH_RELATIONS,
      ...args,
    });
  }

  findById(id) {
    return this.model.findUnique({ where: { id }, ...WITH_RELATIONS });
  }

  create({ items, ...data }) {
    return this.model.create({
      data: {
        ...data,
        items: { create: items || [] },
      },
      ...WITH_RELATIONS,
    });
  }

  update(id, { items, ...data }) {
    return this.model.update({
      where: { id },
      data: {
        ...data,
        ...(items
          ? { items: { deleteMany: {}, create: items } }
          : {}),
      },
      ...WITH_RELATIONS,
    });
  }
}

module.exports = new PrescriptionsRepository();
