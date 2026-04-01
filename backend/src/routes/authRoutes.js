const express = require("express");
const authController = require("../controllers/authController");
const { validateRequest } = require("../middleware/validateRequest");
const authMiddleware = require("../middleware/authMiddleware");
const {
  registerSchema,
  loginSchema,
  magicLinkRequestSchema,
  magicLinkVerifySchema,
  refreshTokenSchema,
} = require("../validators/authValidator");

const router = express.Router();

router.post("/register", validateRequest(registerSchema), authController.register);
router.post("/login", validateRequest(loginSchema), authController.login);
router.post("/magic-link", validateRequest(magicLinkRequestSchema), authController.requestMagicLink);
router.post("/magic-link/verify", validateRequest(magicLinkVerifySchema), authController.verifyMagicLink);
router.post("/refresh", validateRequest(refreshTokenSchema), authController.refreshToken);
router.post("/logout", validateRequest(refreshTokenSchema), authController.logout);
router.get("/me", authMiddleware, authController.getMe);

module.exports = router;
