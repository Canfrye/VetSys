const prisma = require("../../prisma/client");
const BaseRepository = require("../../common/BaseRepository");

class UsersRepository extends BaseRepository {
  constructor() {
    super(prisma.user);
  }

  findByUsername(username) {
    return this.model.findUnique({ where: { username } });
  }
}

module.exports = new UsersRepository();
