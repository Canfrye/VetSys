/**
 * Prisma model delegesini (örn. prisma.customer) saran temel repository.
 * Tüm modüllerin CRUD veri erişim mantığı burada tekilleştirilir; her
 * modül sadece kendine özgü sorguları (ör. cascade silme, isim senkronu)
 * ekler.
 */
class BaseRepository {
  constructor(model) {
    if (!model) {
      throw new Error("BaseRepository icin bir Prisma modeli gerekli.");
    }

    this.model = model;
  }

  findAll(args = {}) {
    return this.model.findMany(args);
  }

  findById(id, args = {}) {
    return this.model.findUnique({ where: { id }, ...args });
  }

  findFirst(args = {}) {
    return this.model.findFirst(args);
  }

  create(data, args = {}) {
    return this.model.create({ data, ...args });
  }

  update(id, data, args = {}) {
    return this.model.update({ where: { id }, data, ...args });
  }

  remove(id) {
    return this.model.delete({ where: { id } });
  }

  count(args = {}) {
    return this.model.count(args);
  }
}

module.exports = BaseRepository;
