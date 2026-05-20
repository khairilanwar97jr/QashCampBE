const supabase = require("../config/supabase");
const PAYMENT_STATUS = require("../constants/paymentStatus");

// --------------------
// CREATE BOOKING + ADDONS
// --------------------
async function createBookingWithAddons(bookingData, bookingRef, paymentStatus = PAYMENT_STATUS.UNPAID) {
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

const { data: pkg, error: pkgError } = await supabase
  .from("package")
  .select("price")
  .eq("id", packageId)
  .single();

if (pkgError) throw pkgError;

if (!pkg) {
  throw new Error("Package not found");
}

console.log("PACKAGE PRICE:", pkg.price);

  // 1️⃣ Insert booking
  const { data: booking, error: bookingError } = await supabase
    .from("user_booking")
    .insert([
      {
        booking_ref: bookingRef,

        first_name: firstName,
        last_name: lastName,
        email_addr: emailAddr,
        total,
        package_id: packageId,
        start_date: startDate,
        end_date: endDate,
        user_id: userId || null,

        status: 1, // active row

        payment_status: paymentStatus,
        booking_type: bookingData.type,
        package_price: pkg.price,
        address1: address1 || null,
        address2: address2 || null,
        address3: address3 || null,
        phone_no: phoneNo || null,
        camp_place: campPlace || null,
        no_id: noId || null,

        // ❌ DO NOT add created_at here
        // DB handles it automatically
      },
    ])
    .select(`
      id,
      booking_ref,
      booking_type,
      first_name,
      last_name,
      email_addr,
      total,
      payment_status,
      createddate
    `)
    .single();

  if (bookingError) throw bookingError;

  // 2️⃣ Insert addons
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
async function updatePaymentAndFinance(
  bookingId,
  paymentStatus,
  totalPaid,
  netAmount
) {
  const { error } = await supabase
    .from("user_booking")
    .update({
      payment_status: paymentStatus,
      total_paid: totalPaid,
      net_amount: netAmount
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
    .select(`
      *,
      package (
        id,
        name
      ),
      booking_attch (
        id
      )
    `)
    .in("payment_status", ["PAID", "DEPOSIT_PAID"])
    .order("id", { ascending: false })
    .limit(5);

  if (error) throw error;

  return data;
}

// ----------------------------------------------------
// FETCH IMAGE SNAPSHOT STRINGS ONLY
// ----------------------------------------------------
async function getAttachmentByRef(bookingRef) {
  const { data, error } = await supabase
    .from("booking_attch")
    .select("summary_snapshot, summary_snapshot_final") // ◄ Added your new column here
    .eq("booking_ref", bookingRef)
    .single(); 

  if (error) {
    if (error.code === "PGRST116") return null; 
    throw error;
  }

  return data;
}

//getbookingplzid
async function getBookingByBillplzId(billplzId) {

  const { data, error } = await supabase
    .from("user_booking")
    .select("*")
    .eq("billplz_id", billplzId)
    .single();

  if (error) throw error;

  return data;
}

async function updateFinancialInit(id, data) {
  return supabase
    .from("user_booking")
    .update(data)
    .eq("id", id);
}

async function searchBooking({ bookingRef, phoneNo, emailAddr }) {

  let query = supabase
    .from("user_booking")
    .select("*");

  if (bookingRef) {
    query = query.eq("booking_ref", bookingRef);
  }

  else if (phoneNo) {
    query = query.eq("phone_no", phoneNo);
  }

  else if (emailAddr) {
    query = query.eq("email_addr", emailAddr);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data;
}

async function getAddonTotal(addOnIds) {

  const { data, error } = await supabase
    .from("add_on_item")
    .select("price")
    .in("id", addOnIds);

  if (error) throw error;

  return data.reduce((sum, item) => sum + item.price, 0);
}

async function getBookingById(id) {

  const { data, error } = await supabase
    .from("user_booking")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data;
}


async function updateBillplzId(id, billplzId) {

  const { error } = await supabase
    .from("user_booking")
    .update({
      billplz_id: billplzId,
    })
    .eq("id", id);

  if (error) throw error;
}

//get booking ref 
async function getBookingByRef(bookingRef) {

  const { data, error } = await supabase
    .from("user_booking")
    .select(`
      *,
      package (
        id,
        name,
        price
      )
    `)
    .eq("booking_ref", bookingRef)
    .single();

  if (error && error.code === "PGRST116") {
  return null; // treat as not found
}

  return data;
}

//get package id
async function getPackageById(packageId) {
  const { data, error } = await supabase
    .from("package")
    .select("*")
    .eq("id", packageId)
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Package not found");
  }

  return data;
}

// ----------------------------------------------------
// UPSERT BOOKING SNAPSHOT ATTACHMENT (Saves or Updates)
// ----------------------------------------------------
async function saveBookingAttachment(bookingRef, summarySnapshot) {
  const { data, error } = await supabase
    .from("booking_attch")
    .upsert(
      {
        booking_ref: bookingRef,
        summary_snapshot: summarySnapshot // Overwrites with the fresh final snapshot string
      },
      { onConflict: "booking_ref" } // Tells Supabase to update if this ref already exists
    )
    .select();

  if (error) {
    throw error;
  }

  return data[0];
}

// ----------------------------------------------------
// LINK ATTACHMENT ID TO USER_BOOKING TABLE
// ----------------------------------------------------
async function updateBookingAttachmentId(bookingId, attachmentId) {
  const { error } = await supabase
    .from("user_booking")
    .update({ booking_attch_id: attachmentId })
    .eq("id", bookingId);

  if (error) throw error;
}

// =================================================================
// UPDATE FINAL PAYMENT SNAPSHOT (Keeps initial snapshot untouched)
// =================================================================
async function updateFinalPaymentSnapshot(bookingRef, finalSnapshotData) {
  const { data, error } = await supabase
    .from("booking_attch")
    .update({ 
      summary_snapshot_final: finalSnapshotData 
    })
    .eq("booking_ref", bookingRef)
    .select();

  if (error) {
    throw error;
  }

  return data[0];
}


// =================================================================
// GET BLOCKED BOOKING DATES BY MONTH & YEAR (WITH COUNT)
// =================================================================
async function getBlockedBookingDates(year, month) {
  const formattedMonth = String(month).padStart(2, '0');
  const startOfPeriod = `${year}-${formattedMonth}-01`;
  
  const lastDay = new Date(year, month, 0).getDate();
  const endOfPeriod = `${year}-${formattedMonth}-${lastDay}`;

  // Add { count: 'exact' } as the second argument to .select()
  const { data, error, count } = await supabase
    .from("user_booking")
    .select("id, package_id, start_date, end_date", { count: "exact" })
    // Change filter to target payment_status array values
    .in("payment_status", ["PAID", "DEPOSIT_PAID"])
    .gte("end_date", startOfPeriod)
    .lte("start_date", endOfPeriod)
    .order("start_date", { ascending: true });

  if (error) {
    throw error;
  }

  // Return both the array data and the row count total
  return {
    records: data,
    totalCount: count || 0
  };
}


module.exports = {
  createBookingWithAddons,
  updatePaymentAndFinance,
  updateBillplzId,
  updatePaymentStatusByBillplzId,
  getBookingById,
  getLatestBookings,
  getBookingByBillplzId,
  updateFinancialInit,
  searchBooking,
  getAddonTotal,
  getBookingByRef,
  getPackageById,
  saveBookingAttachment,
  getAttachmentByRef,
  updateBookingAttachmentId,
  updateFinalPaymentSnapshot,
  getBlockedBookingDates,
};