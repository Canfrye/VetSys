const AppError = require("../utils/AppError");

/**
 * Repository'yi saran, "kayıt var mı" kontrolünü ve 404 fırlatmayı
 * tekilleştiren temel servis. Modüle özgü iş kuralları (cascade silme,
 * benzersizlik kontrolü, hesaplama vb.) alt sınıflarda üzerine yazılır/
 * genişletilir.
 */
class BaseService {
  constructor(repository, resourceName = "Kayıt") {
    this.repository = repository;
    this.resourceName = resourceName;
  }

  async list(args = {}) {
    return this.repository.findAll(args);
  }

  async getById(id, args = {}) {
    const record = await this.repository.findById(id, args);

    if (!record) {
      throw AppError.notFound(this.resourceName);
    }

    return record;
  }

  async create(data) {
    return this.repository.create(data);
  }

  async update(id, data) {
    await this.getById(id);

    return this.repository.update(id, data);
  }

  async remove(id) {
    await this.getById(id);

    return this.repository.remove(id);
  }
}

module.exports = BaseService;
