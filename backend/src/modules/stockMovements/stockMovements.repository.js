const prisma = require("../../prisma/client");
const BaseRepository = require("../../common/BaseRepository");

class StockMovementsRepository extends BaseRepository {
  constructor() {
    super(prisma.stockMovement);
  }

  findAll(args = {}) {
    return this.model.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      ...args,
    });
  }
}

module.exports = new StockMovementsRepository();
