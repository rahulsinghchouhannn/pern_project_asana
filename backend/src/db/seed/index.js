require("dotenv").config();
const { db } = require("../index");
const logger = require("../../config/logger");

const seed = async () => {
  try {
    logger.info("Starting database seed...");

    // Placeholder: add seed data here
    // Example:
    // const { users } = require("../schema");
    // await db.insert(users).values({
    //   email: "admin@example.com",
    //   passwordHash: "hashed_password_here",
    //   name: "Admin User",
    // });

    logger.info("Database seeded successfully");
    process.exit(0);
  } catch (error) {
    logger.error("Database seeding failed:", { error: error.message });
    process.exit(1);
  }
};

seed();
