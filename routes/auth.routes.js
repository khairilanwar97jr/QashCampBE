// routes/auth.routes.js
const express = require("express");
const router = express.Router();
const authService = require("../services/authService");

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const result = await authService.login(email, password);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    // ✅ call registerUser from authService
    const user = await authService.registerUser(req.body);
    res.status(201).json({ message: 'User created', user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


module.exports = router;
