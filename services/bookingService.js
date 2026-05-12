const bookingRepo = require("../repositories/bookingRepo");
const { createBill } = require("../utils/billplz");
const PAYMENT_STATUS = require("../constants/paymentStatus");

// --------------------
// CREATE BOOKING + PAYMENT
// --------------------
async function createBookingAndPayment(bookingData) {
  console.log("🚀 Booking payload received:", bookingData);

  try {
    // 1️⃣ Save booking + add-ons
    const booking = await bookingRepo.createBookingWithAddons(
      bookingData
    );

    // 2️⃣ Create Billplz payment
    const billUrl = await createBill({
      name: `${booking.first_name} ${booking.last_name}`,
      email: booking.email_addr,
      amount: bookingData.total * 100, // RM → sen
      bookingId: booking.id,
    });

    // 3️⃣ Extract Billplz ID
    const billplzId = billUrl.split("/").pop();

    // 4️⃣ Save Billplz ID
    await bookingRepo.updateBillplzId(
      booking.id,
      billplzId
    );

    return {
      booking,
      paymentUrl: billUrl,
      billplzId,
    };
  } catch (err) {
    console.error("BOOKING SERVICE ERROR:", err);
    throw err;
  }
}

// --------------------
// HANDLE BILLPLZ CALLBACK
// --------------------
async function handleBillplzCallback({
  billplzId,
  bookingId,
  paid,
}) {
const isPaid = paid === "true";

const status = isPaid
  ? PAYMENT_STATUS.PAID
  : PAYMENT_STATUS.FAILED;

  if (bookingId) {
    await bookingRepo.updatePaymentStatus(
      bookingId,
      status
    );
  } else if (billplzId) {
    await bookingRepo.updatePaymentStatusByBillplzId(
      billplzId,
      status
    );
  }
}

//redirect method
async function getBookingStatus(id) {
  return await bookingRepo.getBookingById(id);
}

async function getLatestBookings() {
  return bookingRepo.getLatestBookings();
}

module.exports = {
  createBookingAndPayment,
  handleBillplzCallback,
  getBookingStatus,
  getLatestBookings,
};