const bookingRepo = require("../repositories/bookingRepo");
const { createBill } = require("../utils/billplz");
const PAYMENT_STATUS = require("../constants/paymentStatus");
const generateBookingRef = require("../utils/generateBookingRef");

// --------------------
// CREATE BOOKING + PAYMENT
// --------------------
async function createBookingAndPayment(bookingData) {

  const bookingRef = generateBookingRef();

  const isWalkIn = bookingData.type === "WALK_IN";

  const depositAmount = bookingData.deposit_amount || 50;

  // 1️⃣ CREATE BOOKING (always same)
  const booking = await bookingRepo.createBookingWithAddons(
    bookingData,
    bookingRef
  );

  // 2️⃣ INIT FINANCIAL STATE (always same)
  await bookingRepo.updateFinancialInit(booking.id, {
    deposit_amount: depositAmount,
    total_paid: 0,
    refund_amount: 0,
    net_amount: 0,
    payment_status: "UNPAID",
    booking_status: "BOOKED"
  });

  // 3️⃣ DECIDE BILL AMOUNT ONLY
  let billAmount;

  if (isWalkIn) {
    billAmount = bookingData.total;      // FULL PAYMENT
  } else {
    billAmount = depositAmount;          // DEPOSIT ONLY
  }

  // 4️⃣ CREATE BILLPLZ (ALWAYS)
  const billUrl = await createBill({
    name: `${booking.first_name} ${booking.last_name}`,
    email: booking.email_addr,
    amount: billAmount * 100,
    bookingId: booking.id,
    bookingRef: booking.booking_ref,
  });

  const billplzId = billUrl.split("/").pop();

  await bookingRepo.updateBillplzId(booking.id, billplzId);

  return {
    booking,
    paymentUrl: billUrl
  };
}

// --------------------
// HANDLE BILLPLZ CALLBACK
// --------------------
async function handleBillplzCallback({
  billplzId,
  bookingId,
  paid,
  amount,
}) {
  const paidAmount = Number(amount || 0) / 100;
  const isPaid = paid === "true";

  let booking;

  if (bookingId) {
    booking = await bookingRepo.getBookingById(bookingId);
  } else {
    booking = await bookingRepo.getBookingByBillplzId(billplzId);
  }

  if (!booking) throw new Error("Booking not found");

  // already fully paid → stop
  if (booking.payment_status === PAYMENT_STATUS.PAID) {
    console.log("Already fully paid:", booking.id);
    return;
  }

  if (!isPaid) return;

  let paymentStatus = PAYMENT_STATUS.FAILED;
  let newTotalPaid = booking.total_paid || 0;

  // 🟡 FIRST PAYMENT (DEPOSIT)
  if (booking.payment_status !== PAYMENT_STATUS.DEPOSIT_PAID && booking.booking_type === "BOOKING") {

    paymentStatus = PAYMENT_STATUS.DEPOSIT_PAID;
    newTotalPaid = booking.deposit_amount || 0;
  }

  // 🔥 FINAL PAYMENT (IMPORTANT FIX)
  else if (booking.payment_status === PAYMENT_STATUS.DEPOSIT_PAID) {

    paymentStatus = PAYMENT_STATUS.PAID;

    newTotalPaid = (booking.total_paid || 0) + paidAmount;
  }

  // 🟢 WALK-IN (FULL PAYMENT DIRECT)
  else if (booking.booking_type === "WALK_IN") {

    paymentStatus = PAYMENT_STATUS.PAID;
    newTotalPaid = booking.total || 0;
  }

  const netAmount =
    newTotalPaid - (booking.deposit_amount || 0);

  await bookingRepo.updatePaymentAndFinance(
    booking.id,
    paymentStatus,
    newTotalPaid,
    netAmount
  );

  console.log("✅ PAYMENT UPDATED:", {
    bookingId: booking.id,
    paymentStatus,
    newTotalPaid,
    netAmount,
  });
}

//redirect method
async function getBookingStatus(id) {
  return await bookingRepo.getBookingById(id);
}

async function getLatestBookings() {
  return bookingRepo.getLatestBookings();
}

async function searchBooking({ bookingRef, phoneNo, emailAddr }) {

  return bookingRepo.searchBooking({
    bookingRef,
    phoneNo,
    emailAddr,
  });
}
async function createFinalPayment({ bookingId, addOnIds = [], extraNightCount = 0 }) {

  const booking = await bookingRepo.getBookingById(bookingId);

  if (!booking) throw new Error("Booking not found");

  if (booking.payment_status === "PAID") {
    throw new Error("Already fully paid");
  }
  const NIGHT_RATE = 50;

  const nightTotal = extraNightCount * NIGHT_RATE;

  // 1️⃣ calculate add-ons
  let addOnTotal = 0;

  if (addOnIds.length > 0) {
    addOnTotal = await bookingRepo.getAddonTotal(addOnIds);
  }

  // 2️⃣ remaining balance
  const finalAmount =
  (booking.package_price || 0) +
  (addOnTotal || 0) +
  (nightTotal || 0);

  // 3️⃣ create bill
const billUrl = await createBill({
  name: booking.first_name,
  email: booking.email_addr,
  amount: finalAmount * 100,
  bookingId: booking.id,   // ✅ ADD THIS
  bookingRef: booking.booking_ref,
});
  const billplzId = billUrl.split("/").pop();

  await bookingRepo.updateBillplzId(booking.id, billplzId);

return {
  paymentUrl: billUrl,
  amount: finalAmount,
  bookingId: booking.id,   // ✅ ADD THIS TOO
};
}

//get booking ref method 
async function getBookingByRef(bookingRef) {
  return await bookingRepo.getBookingByRef(bookingRef);
}

module.exports = {
  createBookingAndPayment,
  handleBillplzCallback,
  getBookingStatus,
  getLatestBookings,
  searchBooking,
  createFinalPayment,
  getBookingByRef,
};