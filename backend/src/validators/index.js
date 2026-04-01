const authValidators = require("./authValidator");
const userValidators = require("./userValidator");
const organizationValidators = require("./organizationValidator");

module.exports = {
  ...authValidators,
  ...userValidators,
  ...organizationValidators,
};
