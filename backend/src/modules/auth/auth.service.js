const AppError = require("../../utils/AppError");
const { comparePassword } = require("../../utils/password");
const { signToken } = require("../../utils/jwt");
const { serializeUser } = require("../../utils/serialize");

const usersRepository = require("../users/users.repository");

class AuthService {
  async login(username, password) {
    const user = await usersRepository.findByUsername(username.trim());

    if (!user) {
      throw AppError.unauthorized("Kullanıcı adı veya şifre hatalı.");
    }

    if (!user.active) {
      throw AppError.forbidden("Bu kullanıcı hesabı devre dışı bırakılmış.");
    }

    const isValid = await comparePassword(password, user.password);

    if (!isValid) {
      throw AppError.unauthorized("Kullanıcı adı veya şifre hatalı.");
    }

    const token = signToken({
      sub: user.id,
      username: user.username,
      role: user.role,
    });

    return { user: serializeUser(user), token };
  }

  async me(userId) {
    const user = await usersRepository.findById(userId);

    if (!user) {
      throw AppError.unauthorized("Kullanıcı bulunamadı.");
    }

    return serializeUser(user);
  }
}

module.exports = new AuthService();
