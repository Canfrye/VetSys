const prisma = require("../../prisma/client");
const BaseRepository = require("../../common/BaseRepository");

class StockRepository extends BaseRepository {
  constructor() {
    super(prisma.stock);
  }
}

module.exports = new StockRepository();
