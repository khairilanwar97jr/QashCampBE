const supabase = require("../config/supabase");

const CLEANUP_DAYS = 2;

function shiftDate(dateString, days) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

// --------------------
// FETCH ALL PACKAGES
// --------------------
async function findAllPackages() {
  const { data, error } = await supabase
    .from("package")
    .select("id, name");

  if (error) throw error;

  return data;
}

// --------------------
// FIND OVERLAPPING BOOKINGS
// --------------------
async function findOverlappingBookings(
  packageId,
  startDate,
  endDate
) {
  // Cleanup is part of each booking's reserved period. Check the two-day
  // cleanup buffer after both the existing booking and the requested booking.
  const existingBookingEndThreshold = shiftDate(startDate, -CLEANUP_DAYS);
  const requestedBookingEndWithCleanup = shiftDate(endDate, CLEANUP_DAYS);

  const { data, error } = await supabase
    .from("user_booking")
    .select("id, payment_status")
    .eq("package_id", packageId)
    .lte("start_date", requestedBookingEndWithCleanup)
    .gte("end_date", existingBookingEndThreshold);

  if (error) throw error;

  return data;
}

// Fetch bookings that affect a package calendar range, including the
// two-day buffer before and after each booking.
async function findBookingsForBlockedDates(packageId, startDate, endDate) {
  const bookingEndThreshold = shiftDate(startDate, -CLEANUP_DAYS);
  const bookingStartThreshold = shiftDate(endDate, CLEANUP_DAYS);

  const { data, error } = await supabase
    .from("user_booking")
    .select("id, start_date, end_date, payment_status, booking_status")
    .eq("package_id", packageId)
    .lte("start_date", bookingStartThreshold)
    .gte("end_date", bookingEndThreshold);

  if (error) throw error;

  return data;
}

async function findPackageById(id) {

  const { data, error } = await supabase
    .from("package")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

module.exports = {
  findAllPackages,
  findOverlappingBookings,
  findBookingsForBlockedDates,
  findPackageById,
};
