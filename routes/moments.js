const express = require("express");
const router = express.Router();
const service = require("../services/momentsService");
const multer = require("multer");

const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage()
});


// Public timeline
router.get("/", async (req, res) => {
  try {
    const moments = await service.getTimeline();
    res.json(moments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Submit new moment (UPLOAD → CLOUDINARY → DB)
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { caption, userId } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

const moment = await service.submitMoment(
  caption,
  req.file.buffer,
  userId
);

    res.status(201).json(moment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Admin: get all moments
router.get("/admin", async (req, res) => {
  try {
    const moments = await service.getAdminMoments();
    res.json(moments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Admin: approve
router.patch("/:id/approve", async (req, res) => {
  try {
    const moment = await service.approveMoment(req.params.id);
    res.json(moment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Admin: reject
router.patch("/:id/reject", async (req, res) => {
  try {
    const moment = await service.rejectMoment(req.params.id);
    res.json(moment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
