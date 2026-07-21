const prisma = require("../../prisma/client");
const BaseRepository = require("../../common/BaseRepository");

const WITH_RELATIONS = {
  include: {
    animal: true,
    customer: true,
    invoice: true,
  },
};

class PaymentsRepository extends BaseRepository {
  constructor() {
    super(prisma.payment);
  }

  findAll(args = {}) {
    return this.model.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      ...WITH_RELATIONS,
      ...args,
    });
  }

  findById(id) {
    return this.model.findUnique({ where: { id }, ...WITH_RELATIONS });
  }

  create(data) {
    return this.model.create({ data, ...WITH_RELATIONS });
  }

  update(id, data) {
    return this.model.update({ where: { id }, data, ...WITH_RELATIONS });
  }
}

module.exports = new PaymentsRepository();
