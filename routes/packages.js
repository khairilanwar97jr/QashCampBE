const express = require("express");
const router = express.Router();
const { getAllPackagesAvailability } = require("../services/packageService");

router.get("/availability", async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ message: "Missing startDate or endDate" });
  }

  try {
    const availability = await getAllPackagesAvailability(startDate, endDate);
    res.json(availability);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
