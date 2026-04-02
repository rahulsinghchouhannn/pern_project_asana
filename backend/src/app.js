require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const requestLogger = require("./middleware/requestLogger");
const errorHandler = require("./middleware/errorHandler");
const routes = require("./routes");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(requestLogger);

app.use("/api", routes);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "asana-api" });
});

app.use(errorHandler);

module.exports = app;
