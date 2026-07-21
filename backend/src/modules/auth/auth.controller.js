const asyncHandler = require("../../middleware/asyncHandler");
const { sendSuccess } = require("../../utils/apiResponse");

const authService = require("./auth.service");

const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const result = await authService.login(username, password);

  sendSuccess(res, { data: result });
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.me(req.user.sub);

  sendSuccess(res, { data: user });
});

module.exports = { login, me };
