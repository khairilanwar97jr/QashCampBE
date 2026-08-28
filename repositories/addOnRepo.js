const supabase = require("../config/supabase");

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

// Get all active add-ons
async function getAllActiveAddOns() {
  const { data, error } = await supabase
    .from("add_on_item")
    .select("id, name, price, image_url, avail, status, max_quantity")
    .eq("status", 1);

  if (error) throw error;

  return data;
}

// Get quantities reserved by confirmed bookings that overlap the requested dates.
async function getReservedQuantities(startDate, endDate) {
  const availabilityStartDate = addDays(startDate, -1);
  const availabilityEndDate = addDays(endDate, 1);

  const { data: bookings, error: bookingError } = await supabase
    .from("user_booking")
    .select("id")
    .in("payment_status", ["PAID", "DEPOSIT_PAID"])
    .lte("start_date", availabilityEndDate)
    .gte("end_date", availabilityStartDate);

  if (bookingError) throw bookingError;
  if (!bookings.length) return {};

  const bookingIds = bookings.map(({ id }) => id);
  const { data: reservations, error: reservationError } = await supabase
    .from("booking_addon_reservation")
    .select("addon_id, quantity")
    .in("booking_id", bookingIds)
    .eq("status", 1)
    .lte("start_date", availabilityEndDate)
    .gte("end_date", availabilityStartDate);

  if (reservationError) throw reservationError;

  return reservations.reduce((totals, reservation) => {
    const addonId = Number(reservation.addon_id);
    totals[addonId] = (totals[addonId] || 0) + Number(reservation.quantity || 0);
    return totals;
  }, {});
}

module.exports = {
  getAllActiveAddOns,
  getReservedQuantities,
};
