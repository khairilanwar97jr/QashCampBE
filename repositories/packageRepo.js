const supabase = require("../config/supabase");

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
  const { data, error } = await supabase
    .from("user_booking")
    .select("id, payment_status")
    .eq("package_id", packageId)
    .lte("start_date", endDate)
    .gte("end_date", startDate);

  if (error) throw error;

  return data;
}

module.exports = {
  findAllPackages,
  findOverlappingBookings,
};