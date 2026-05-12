const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

/**
 * Protected route
 * Token REQUIRED
 */
router.get("/profile", authMiddleware, (req, res) => {
  res.json({
    message: "Login success",
    user: req.user
  });
});

module.exports = router;
