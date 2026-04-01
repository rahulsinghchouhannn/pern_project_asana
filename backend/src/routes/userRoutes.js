const express = require("express");
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/me", authMiddleware, userController.getMe);
router.get("/", authMiddleware, userController.getAllUsers);

module.exports = router;
