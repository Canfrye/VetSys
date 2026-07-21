const BaseService = require("../../common/BaseService");
const customersRepository = require("./customers.repository");

class CustomersService extends BaseService {
  constructor() {
    super(customersRepository, "Müşteri");
  }
}

module.exports = new CustomersService();
