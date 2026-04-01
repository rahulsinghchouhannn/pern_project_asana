const authValidators = require("./authValidator");
const userValidators = require("./userValidator");

module.exports = {
  ...authValidators,
  ...userValidators,
};
