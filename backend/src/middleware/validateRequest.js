const errorResponse = require("../utils/errorResponse");

const validateRequest = (schema, target = "body") => (req, res, next) => {
  const result = schema.safeParse(req[target]);
  if (!result.success) {
    const message = result.error.errors.map((e) => e.message).join(", ");
    return res.status(400).json(errorResponse(message));
  }
  req.validated = result.data;
  next();
};

module.exports = { validateRequest };
