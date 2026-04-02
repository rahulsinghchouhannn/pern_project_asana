require("dotenv").config();
const http = require("http");
const app = require("./app");
const logger = require("./config/logger");
const { pool } = require("./db");
const { initSocket } = require("./config/socket");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    const client = await pool.connect();
    client.release();
    logger.info("Database connection established");

    const httpServer = http.createServer(app);
    initSocket(httpServer);

    httpServer.listen(PORT, () => {
      logger.info(
        `Asana API server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`
      );
    });
  } catch (error) {
    logger.error("Failed to start server:", { error: error.message });
    process.exit(1);
  }
};

startServer();
