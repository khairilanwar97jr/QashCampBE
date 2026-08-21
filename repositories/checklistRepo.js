const supabase = require("../config/supabase");

async function getBookingPackageByRef(bookingRef) {
  const { data, error } = await supabase
    .from("user_booking")
    .select(`
      id,
      package_id,
      package (
        id,
        name
      )
    `)
    .eq("booking_ref", bookingRef)
    .maybeSingle();

  if (error) throw error;

  return data;
}

async function getActivePackageItems(packageId) {
  const { data, error } = await supabase
    .from("package_item")
    .select(`
      expected_quantity,
      item!inner (
        id,
        name,
        image_url,
        description
      )
    `)
    .eq("package_id", packageId)
    .eq("item.status", 1)
    .order("name", { referencedTable: "item", ascending: true });

  if (error) throw error;

  return data || [];
}

async function getActiveBookingAddOns(bookingId) {
  const { data, error } = await supabase
    .from("booking_addon_reservation")
    .select(`
      quantity,
      status,
      add_on_item!inner (
        id,
        name,
        image_url,
        status
      )
    `)
    .eq("booking_id", bookingId)
    .eq("status", 1)
    .eq("add_on_item.status", 1)
    .order("name", { referencedTable: "add_on_item", ascending: true });

  if (error) throw error;

  return data || [];
}

module.exports = {
  getBookingPackageByRef,
  getActivePackageItems,
  getActiveBookingAddOns,
};
