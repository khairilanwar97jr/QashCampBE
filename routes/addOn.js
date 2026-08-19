const express = require("express");
const router = express.Router();
const addOnService = require("../services/addOnService");

// GET /api/addon/availability?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get("/availability", async (req, res) => {
  const { startDate, endDate } = req.query;
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (
    !datePattern.test(startDate || "") ||
    !datePattern.test(endDate || "") ||
    startDate > endDate
  ) {
    return res.status(400).json({
      message: "Valid startDate and endDate are required (YYYY-MM-DD)",
    });
  }

  try {
    const list = await addOnService.getAddOnAvailability(startDate, endDate);
    res.status(200).json(list);
  } catch (err) {
    console.error("Error fetching add-on availability", err);
    res.status(500).json({ message: "Server error" });
  }
});

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
