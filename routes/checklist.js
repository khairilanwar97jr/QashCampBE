const express = require("express");
const router = express.Router();
const checklistService = require("../services/checklistService");

router.get("/:bookingRef", async (req, res) => {
  try {
    const checklist = await checklistService.getTentChecklist(
      req.params.bookingRef
    );

    return res.status(200).json(checklist);
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    console.error("CHECKLIST ROUTE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch tent checklist",
    });
  }
});

module.exports = router;
