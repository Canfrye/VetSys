const prisma = require("../../prisma/client");
const BaseRepository = require("../../common/BaseRepository");

const WITH_RELATIONS = {
  include: { animal: true, customer: true },
};

class AppointmentsRepository extends BaseRepository {
  constructor() {
    super(prisma.appointment);
  }

  findAll(args = {}) {
    return this.model.findMany({
      orderBy: [{ date: "desc" }, { time: "asc" }],
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

  findByVeterinarianAndDate(veterinarian, date, excludeId = null) {
    return this.model.findMany({
      where: {
        veterinarian,
        date,
        status: { not: "İptal" },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }
}

module.exports = new AppointmentsRepository();
