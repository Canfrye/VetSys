const prisma = require("../../prisma/client");
const BaseRepository = require("../../common/BaseRepository");

const WITH_CUSTOMER = { include: { customer: true } };

class AnimalsRepository extends BaseRepository {
  constructor() {
    super(prisma.animal);
  }

  findAll(args = {}) {
    return this.model.findMany({ orderBy: { name: "asc" }, ...WITH_CUSTOMER, ...args });
  }

  findById(id) {
    return this.model.findUnique({ where: { id }, ...WITH_CUSTOMER });
  }

  create(data) {
    return this.model.create({ data, ...WITH_CUSTOMER });
  }

  update(id, data) {
    return this.model.update({ where: { id }, data, ...WITH_CUSTOMER });
  }

  findByMicrochip(microchipNo) {
    return this.model.findUnique({ where: { microchipNo } });
  }
}

module.exports = new AnimalsRepository();
