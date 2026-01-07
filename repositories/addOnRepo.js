const db = require("../lib/db"); // your pg Pool

// Get all active add-ons (status = 1)
async function getAllActiveAddOns() {
  const { rows } = await db.query(
    `SELECT id, name, price, image_url, avail, status
     FROM add_on_item
     WHERE status = $1`,
    [1]
  );
  return rows;
}

module.exports = {
  getAllActiveAddOns,
};
