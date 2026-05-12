const express = require('express');
const router = express.Router();
const bookingService = require('../services/bookingService');

// Create booking + generate payment link
router.post('/book', async (req, res) => {
  try {
    const bookingData = req.body; // expect all required fields
    const result = await bookingService.createBookingAndPayment(bookingData);

    res.json({
      success: true,
      paymentUrl: result.paymentUrl,
      bookingId: result.booking.id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create booking.' });
  }
});

router.post('/billplz-callback', async (req, res) => {
  const billplzId = req.body?.id;
  let bookingId = req.body?.reference_1;
  const paid = req.body?.paid;

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
    paid
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


module.exports = router;
