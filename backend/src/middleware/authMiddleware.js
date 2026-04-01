const jwt = require("jsonwebtoken");
const errorResponse = require("../utils/errorResponse");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json(errorResponse("Access token required"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json(errorResponse("Token expired"));
    }
    return res.status(401).json(errorResponse("Invalid token"));
  }
};

module.exports = authMiddleware;
