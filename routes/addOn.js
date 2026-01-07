const express = require("express");
const router = express.Router();
const addOnService = require("../services/addOnService");

// GET /api/addon
router.get("/", async (req, res) => {
  try {
    const list = await addOnService.getAllActiveAddOns();
    console.log(`✅ Returning ${list.length} add-ons`);
    res.status(200).json(list);
  } catch (err) {
    console.error("Error fetching add-ons", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
