const BaseService = require("../../common/BaseService");
const AppError = require("../../utils/AppError");
const { hashPassword } = require("../../utils/password");
const { serializeUser, mapRoleFromFe } = require("../../utils/serialize");

const usersRepository = require("./users.repository");

function sanitize(user) {
  return serializeUser(user);
}

class UsersService extends BaseService {
  constructor() {
    super(usersRepository, "Kullanıcı");
  }

  async list(args) {
    const users = await super.list(args);
    return users.map(sanitize);
  }

  async getById(id) {
    const user = await super.getById(id);
    return sanitize(user);
  }

  async create(data) {
    const existing = await usersRepository.findByUsername(data.username);

    if (existing) {
      throw AppError.conflict("Bu kullanıcı adı zaten kullanılıyor.");
    }

    const hashed = await hashPassword(data.password);
    const role = mapRoleFromFe(data.role) || data.role;

    const user = await usersRepository.create({
      ...data,
      role,
      password: hashed,
    });

    return sanitize(user);
  }

  async update(id, data) {
    await this.getById(id);

    const payload = { ...data };

    if (payload.role) {
      payload.role = mapRoleFromFe(payload.role) || payload.role;
    }

    if (payload.password) {
      payload.password = await hashPassword(payload.password);
    } else {
      delete payload.password;
    }

    const user = await usersRepository.update(id, payload);

    return sanitize(user);
  }
}

module.exports = new UsersService();
