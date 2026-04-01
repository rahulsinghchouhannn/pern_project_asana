const logger = require("../config/logger");
const errorResponse = require("../utils/errorResponse");

const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";

  logger.error({
    message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
  });

  res.status(statusCode).json(errorResponse(message));
};

module.exports = errorHandler;
