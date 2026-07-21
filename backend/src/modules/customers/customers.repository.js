const prisma = require("../../prisma/client");
const BaseRepository = require("../../common/BaseRepository");

class CustomersRepository extends BaseRepository {
  constructor() {
    super(prisma.customer);
  }
}

module.exports = new CustomersRepository();
