const db = require("../lib/db");

// Fetch all packages dynamically
async function findAllPackages() {
  const { rows } = await db.query(`SELECT id, name FROM "package"`);
  return rows;
}

// Fetch overlapping bookings for a package
async function findOverlappingBookings(packageId, startDate, endDate) {
const { rows } = await db.query(
  `
  SELECT id, payment_status
  FROM user_booking
  WHERE package_id = $1
    AND start_date <= $2
    AND end_date >= $3
  `,
  [packageId, endDate, startDate]
);

return rows;
}

module.exports = { findAllPackages, findOverlappingBookings };
