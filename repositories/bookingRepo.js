const supabase = require("../config/supabase");
const PAYMENT_STATUS = require("../constants/paymentStatus");

// --------------------
// CREATE BOOKING + ADDONS
// --------------------
async function createBookingWithAddons(bookingData) {
  const {
    firstName,
    lastName,
    emailAddr,
    total,
    packageId,
    startDate,
    endDate,
    userId,
    address1,
    address2,
    address3,
    phoneNo,
    campPlace,
    noId,
    addOnIds = [],
  } = bookingData;

  // 1️⃣ Create booking
  const { data: booking, error: bookingError } = await supabase
    .from("user_booking")
    .insert([
      {
        first_name: firstName,
        last_name: lastName,
        email_addr: emailAddr,
        total,
        package_id: packageId,
        start_date: startDate,
        end_date: endDate,
        user_id: userId || null,
        status: 1,
        payment_status: PAYMENT_STATUS.PENDING,
        address1: address1 || null,
        address2: address2 || null,
        address3: address3 || null,
        phone_no: phoneNo || null,
        camp_place: campPlace || null,
        no_id: noId || null,
      },
    ])
    .select(`
      id,
      first_name,
      last_name,
      email_addr,
      total,
      package_id
    `)
    .single();

  if (bookingError) throw bookingError;

  // 2️⃣ Insert add-ons
  if (addOnIds.length > 0) {
    const addonRows = addOnIds.map((addOnId) => ({
      booking_id: booking.id,
      addon_id: addOnId,
      start_date: startDate,
      end_date: endDate,
      status: 1,
    }));

    const { error: addonError } = await supabase
      .from("booking_addon_reservation")
      .insert(addonRows);

    if (addonError) throw addonError;
  }

  return booking;
}

// --------------------
// UPDATE PAYMENT STATUS
// --------------------
async function updatePaymentStatus(bookingId, paymentStatus) {
  const { error } = await supabase
    .from("user_booking")
    .update({
      payment_status: paymentStatus,
    })
    .eq("id", bookingId);

  if (error) throw error;
}

// --------------------
// UPDATE BILLPLZ ID
// --------------------
async function updateBillplzId(bookingId, billplzId) {
  const { error } = await supabase
    .from("user_booking")
    .update({
      billplz_id: billplzId,
    })
    .eq("id", bookingId);

  if (error) throw error;
}

// --------------------
// UPDATE PAYMENT STATUS BY BILLPLZ ID
// --------------------
async function updatePaymentStatusByBillplzId(
  billplzId,
  paymentStatus
) {
  const { error } = await supabase
    .from("user_booking")
    .update({
      payment_status: paymentStatus,
    })
    .eq("billplz_id", billplzId);

  if (error) throw error;
}

//call the id upon redirecting 
async function getBookingById(id) {

  console.log("SEARCHING BOOKING ID:", id);

  const { data, error } = await supabase
    .from("user_booking")
    .select("*")
    .eq("id", Number(id))
    .single();

  console.log("SUPABASE DATA:", data);
  console.log("SUPABASE ERROR:", error);

  if (error) {
    throw error;
  }

  return data;
}

async function getLatestBookings() {
  const { data, error } = await supabase
    .from("user_booking")
    .select("*")
    .eq("payment_status", "PAID")   // optional but recommended
    .order("id", { ascending: false })
    .limit(5);

  if (error) throw error;
  return data;
}

module.exports = {
  createBookingWithAddons,
  updatePaymentStatus,
  updateBillplzId,
  updatePaymentStatusByBillplzId,
  getBookingById,
  getLatestBookings,
  
};