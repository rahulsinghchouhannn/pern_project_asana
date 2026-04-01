require("dotenv").config();

module.exports = {
  schema: "./src/db/schema/index.js",
  out: "./src/db/migrations",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
};
