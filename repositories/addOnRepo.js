const supabase = require("../config/supabase");

// Get all active add-ons
async function getAllActiveAddOns() {
  const { data, error } = await supabase
    .from("add_on_item")
    .select("id, name, price, image_url, avail, status")
    .eq("status", 1);

  if (error) throw error;

  return data;
}

module.exports = {
  getAllActiveAddOns,
};