const express = require("express");
const router = express.Router();

const packageService = require("../services/packageService");

router.get("/availability", async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({
      message: "Missing startDate or endDate"
    });
  }

  try {
    const availability =
      await packageService.getAllPackagesAvailability(startDate, endDate);

    res.json(availability);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get blocked calendar dates for one package
router.get("/:id/blocked-dates", async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({
      message: "Missing startDate or endDate"
    });
  }

  try {
    const blockedDates = await packageService.getPackageBlockedDates(
      id,
      startDate,
      endDate
    );

    res.json(blockedDates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


//get package by id
router.get("/:id", async (req, res) => {

  try {
    const { id } = req.params;

    const result =
      await packageService.getPackageById(id);

    res.status(200).json(result);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: err.message
    });
  }
});

module.exports = router;
