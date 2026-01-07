const { findAllPackages, findOverlappingBookings } = require("../repositories/packageRepo");

// Check a single package
async function isAvailable(packageId, startDate, endDate) {
  const bookings = await findOverlappingBookings(packageId, startDate, endDate);
  // Only PAID bookings block availability
  return !bookings.some(b => b.payment_status === 1);
}

// Check all packages dynamically
async function getAllPackagesAvailability(startDate, endDate) {
  const packages = await findAllPackages();
  const result = {};

  for (const pkg of packages) {
    const available = await isAvailable(pkg.id, startDate, endDate);
    result[pkg.name] = available;
  }

  return result;
}

module.exports = { getAllPackagesAvailability };
