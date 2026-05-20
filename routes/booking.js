const express = require('express');
const router = express.Router();
const bookingService = require('../services/bookingService');
const bookingSchema = require("../schemas/bookingSchema");

// Create booking + generate payment link
router.post("/book", async (req, res) => {
  try {
    // 🔥 VALIDATE HERE
    const bookingData = bookingSchema.parse(req.body);

    const result = await bookingService.createBookingAndPayment(bookingData);

    res.json({
      success: true,
      bookingRef: result.booking.booking_ref,
      paymentUrl: result.paymentUrl,
      bookingId: result.booking.id
    });

  } catch (err) {
    console.error(err);

    res.status(400).json({
      success: false,
      message: err.message
    });
  }
});

router.post('/billplz-callback', async (req, res) => {
  const billplzId = req.body?.id;
  let bookingId = req.body?.reference_1;
  let packageId = req.body?.reference_2;
  const paid = req.body?.paid;
  const amount = req.body?.amount; // 👈 ADD THIS

  console.log("📥 CALLBACK:", req.body);

  // ⚠️ only reject if totally invalid
  if (!paid || !billplzId) {
    console.log("⚠ Invalid callback payload");
    return res.status(200).json({ received: false });
  }

  // respond immediately
  res.status(200).json({ received: true });

  bookingService.handleBillplzCallback({
    billplzId,
    bookingId,
    packageId,  // 👈 ADD THIS
    paid,
      amount   // 👈 ADD THIS
  }).catch(err => {
    console.error("❌ Callback error:", err.message);
  });
});

// GET booking status (SECURE CHECK)
router.get("/booking/:id/status", async (req, res) => {
  try {

    console.log("PARAM ID:", req.params.id);

    const booking = await bookingService.getBookingStatus(req.params.id);

    console.log("BOOKING RESULT:", booking);

    if (!booking) {
      return res.status(404).json({ success: false });
    }

    res.json({
      success: true,
      bookingId: booking.id,
      paymentStatus: booking.payment_status,
      name: booking.first_name,
      bookingRef: booking.booking_ref,
    });

  } catch (err) {
    console.error("STATUS ROUTE ERROR:", err);

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});


router.get("/latest", async (req, res) => {
  try {
    const data = await bookingService.getLatestBookings();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch heavy base64 snapshots on demand
router.get("/:bookingRef/attachment", async (req, res) => {
  try {
    const { bookingRef } = req.params;
    const attachment = await bookingService.getBookingSnapshot(bookingRef);

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: "No layout snapshot string found for this reference key."
      });
    }

    res.json({
      success: true,
      // ◄ Returns both snapshots side-by-side cleanly
      summarySnapshot: attachment.summary_snapshot,
      summarySnapshotFinal: attachment.summary_snapshot_final 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

router.get("/search", async (req, res) => {
  try {

    const { phoneNo, emailAddr, bookingRef } = req.query;

    console.log("SEARCH INPUT:", req.query);

    const data = await bookingService.searchBooking({
      phoneNo,
      emailAddr,
      bookingRef,   // 👈 ADD THIS
    });

    res.json({
      success: true,
      data,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

router.post("/pay-final", async (req, res) => {
  try {
    const result = await bookingService.createFinalPayment(req.body);

res.json({
  success: true,
  paymentUrl: result.paymentUrl,
  amount: result.amount,
  bookingId: result.bookingId,
});

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

router.get("/getBooking", async (req, res) => {
  const { ref } = req.query;

  if (!ref) {
    return res.status(400).json({
      success: false,
      message: "Booking reference is required",
    });
  }

  const data = await bookingService.getBookingByRef(ref);

  if (!data) {
    return res.status(404).json({
      success: false,
      message: "Booking not found",
    });
  }

  res.json({ success: true, data });
});


// =================================================================
// GET BLOCKED DATES ROUTE
// =================================================================
router.get("/blocked-dates", async (req, res) => {
  try {
    const now = new Date();
    // Default to current year and month (1-12 format) if missing
    const year = parseInt(req.query.year) || now.getFullYear();
    const month = parseInt(req.query.month) || (now.getMonth() + 1);

    const result = await bookingService.getBlockedLogisticsTimelines(year, month);

    res.json({
      success: true,
      year,
      month,
      total: result.total,
      bookings: result,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;
