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
  let depositAmount;

  // Determine deposit based on package ID
  if (bookingData.packageId >= 1 && bookingData.packageId <= 6) {
    depositAmount = 50;
  } else if (bookingData.packageId === 7) {
    depositAmount = 100;
  } else {
    // If needed, handle unexpected package IDs
    throw new Error("Invalid package ID for deposit calculation");
  }

  const FPX_FEE = 1.25;

  // ==================================================
  // 1️⃣ GET PACKAGE PRICE (FROM DB)
  // ==================================================
  const pkgData = await bookingRepo.getPackageById(bookingData.packageId);

  if (!pkgData) {
    throw new Error("Package not found");
  }

  const packagePrice = pkgData.price;

  // ==================================================
  // 2️⃣ CALCULATE ADD-ONS
  // ==================================================
  const addOnTotal = Array.isArray(bookingData.addOnIds) && bookingData.addOnIds.length
    ? await bookingRepo.getAddonTotal(bookingData.addOnIds)
    : 0;

  // ==================================================
  // 3️⃣ CALCULATE NIGHTS
  // ==================================================
  const nightCount = calculateNights(
    bookingData.startDate,
    bookingData.endDate
  );

  const nightTotal = (nightCount - 1) * 50;

  // ==================================================
  // 4️⃣ EXPECTED TOTAL (BACKEND TRUTH)
  // ==================================================
  let expectedTotal;

  if (isWalkIn) {
    // WALK-IN = full calculation
    expectedTotal =
      packagePrice +
      addOnTotal +
      nightTotal +
      depositAmount;
  } else {
    // BOOKING = deposit only
    expectedTotal = depositAmount;
  }

  console.log("===== PRICE CALCULATION =====");
  console.log("Frontend Total:", bookingData.total);
  console.log("Package:", packagePrice);
  console.log("AddOns:", addOnTotal);
  console.log("Nights:", nightTotal);
  console.log("Deposit:", depositAmount);
  console.log("Expected Total:", expectedTotal);

  // ==================================================
  // 5️⃣ VALIDATION (BEFORE DB SAVE)
  // ==================================================
  if (Number(bookingData.total) !== Number(expectedTotal)) {
    console.log("❌ TOTAL MISMATCH");
    throw new Error(
      `Total mismatch. FE: ${bookingData.total}, BE: ${expectedTotal}`
    );
  }

  console.log("✅ TOTAL VALIDATED");

// ==================================================
// 6️⃣ SAVE BOOKING (ONLY AFTER VALIDATION)
// ==================================================
const booking = await bookingRepo.createBookingWithAddons(
  bookingData,
  bookingRef
);

// If the frontend passed a canvas image string, save it into 'booking_attch'
if (bookingData.summarySnapshot) {
  try {
    // 1. Save attachment and capture the returned row object 
    const savedAttachment = await bookingRepo.saveBookingAttachment(
      bookingRef, 
      bookingData.summarySnapshot
    );
    
    // 2. ✅ LINK IT BACK SAFELY USING THE REPO METHOD (Fixes the "supabase is not defined" error!)
    if (savedAttachment && savedAttachment.id) {
      await bookingRepo.updateBookingAttachmentId(booking.id, savedAttachment.id);
        
      console.log(`✅ LINKED ATTACHMENT ID ${savedAttachment.id} TO BOOKING ID ${booking.id}`);
    }
    
    console.log("✅ SNAPSHOT ATTACHMENT SAVED SUCCESSFULLY");
  } catch (attachErr) {
    console.error("⚠️ Failed to save snapshot attachment:", attachErr.message);
  }
}

  // ==================================================
  // 7️⃣ INIT FINANCIAL STATE
  // ==================================================
  await bookingRepo.updateFinancialInit(booking.id, {
    deposit_amount: depositAmount,
    total_paid: 0,
    refund_amount: 0,
    net_amount: 0,
    payment_status: "UNPAID",
    booking_status: "BOOKED"
  });

  // ==================================================
  // 8️⃣ DETERMINE BILL AMOUNT
  // ==================================================
  let billAmount;

  if (isWalkIn) {
    billAmount =
      packagePrice +
      addOnTotal +
      nightTotal +
      depositAmount + FPX_FEE;
  } else {
    billAmount = depositAmount + FPX_FEE
  }

  // ==================================================
  // 9️⃣ CREATE BILLPLZ PAYMENT
  // ==================================================
  const billUrl = await createBill({
    name: `${booking.first_name} ${booking.last_name}`,
    email: booking.email_addr,
    amount: billAmount * 100,
    bookingId: booking.id,
    bookingRef: booking.booking_ref,
    packageId: booking.package_id
  });

  const billplzId = billUrl.split("/").pop();

  await bookingRepo.updateBillplzId(booking.id, billplzId);

  // ==================================================
  // 🔟 RETURN RESPONSE
  // ==================================================
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
  const FPX_FEE = 1.25;
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

  // Determine deposit based on package
  let deposit = booking.deposit_amount;
  if (booking.package_id === 7) {
    deposit = 100;
  }

  // 🟡 FIRST PAYMENT (DEPOSIT)
  if (booking.payment_status !== PAYMENT_STATUS.DEPOSIT_PAID && booking.booking_type === "BOOKING") {
    paymentStatus = PAYMENT_STATUS.DEPOSIT_PAID;
    newTotalPaid = deposit;
  }
  // 🔥 FINAL PAYMENT (IMPORTANT FIX)
  else if (booking.payment_status === PAYMENT_STATUS.DEPOSIT_PAID) {
    paymentStatus = PAYMENT_STATUS.PAID;
    const cleanPaidAmount = paidAmount - FPX_FEE;
    newTotalPaid = (booking.total_paid || 0) + cleanPaidAmount;
  }
  // 🟢 WALK-IN (FULL PAYMENT DIRECT)
  else if (booking.booking_type === "WALK_IN") {
    paymentStatus = PAYMENT_STATUS.PAID;
    newTotalPaid = booking.total || 0;
  }

  const netAmount = newTotalPaid - deposit;

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

async function getBookingSnapshot(bookingRef) {
  if (!bookingRef) throw new Error("Booking reference string is required");
  return bookingRepo.getAttachmentByRef(bookingRef);
}

async function searchBooking({ bookingRef, phoneNo, emailAddr }) {

  return bookingRepo.searchBooking({
    bookingRef,
    phoneNo,
    emailAddr,
  });
}

// ==================================================
// FINAL PAYMENT (FOR BOOKING ONLY)
// ==================================================
async function createFinalPayment({
  bookingId,
  addOnIds = [],
  extraNightCount = 0,
  summarySnapshot // ◄ Added to capture frontend base64 payload
}) {

  const FPX_FEE = 1.25;
  const NIGHT_RATE = 50;

  const booking = await bookingRepo.getBookingById(bookingId);
  if (!booking) throw new Error("Booking not found");

  if (booking.payment_status === "PAID") {
    throw new Error("Already fully paid");
  }

  // ==================================================
  // 📸 SAVE THE FINAL PAYMENT SNAPSHOT
  // ==================================================
  if (summarySnapshot) {
    // Updates only the new column on the existing unique row
    await bookingRepo.updateFinalPaymentSnapshot(booking.booking_ref, summarySnapshot);
  }

  // ==================================================
  // 1️⃣ GET BASE DATA
  // ==================================================
  const pkgData = await bookingRepo.getPackageById(booking.package_id);
  const packagePrice = pkgData.price;

  const addOnTotal = addOnIds?.length
    ? await bookingRepo.getAddonTotal(addOnIds)
    : 0;

  const nightTotal = extraNightCount * NIGHT_RATE;

  const depositAmount = booking.deposit_amount;

  // ==================================================
  // 2️⃣ FULL BUSINESS TOTAL (NO FPX)
  // ==================================================
  const fullTotal =
    packagePrice +
    addOnTotal +
    nightTotal +
    depositAmount;

  // ==================================================
  // 3️⃣ REMAINING BUSINESS AMOUNT
  // ==================================================
  const remaining =
    fullTotal - (booking.total_paid || 0);

  // ==================================================
  // 4️⃣ BILLPLZ AMOUNT (INCLUDES FPX)
  // ==================================================
  const billAmount = remaining + FPX_FEE;

  // ==================================================
  // 5️⃣ CREATE BILL
  // ==================================================
  const billUrl = await createBill({
    name: booking.first_name,
    email: booking.email_addr,
    amount: Math.round(billAmount * 100),
    bookingId: booking.id,
    bookingRef: booking.booking_ref,
    packageId: booking.package_id
  });

  const billplzId = billUrl.split("/").pop();

  await bookingRepo.updateBillplzId(booking.id, billplzId);

  return {
    paymentUrl: billUrl,
    amount: billAmount,
    bookingId: booking.id
  };
}



//get booking ref method 
async function getBookingByRef(bookingRef) {
  return await bookingRepo.getBookingByRef(bookingRef);
}

//clacualate total amount for add on and extra night  
function calculateNights(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const diffTime = end - start;
  return Math.max(1, diffTime / (1000 * 60 * 60 * 24));
}

module.exports = {
  createBookingAndPayment,
  handleBillplzCallback,
  getBookingStatus,
  getLatestBookings,
  searchBooking,
  createFinalPayment,
  getBookingByRef,
  getBookingSnapshot,
};