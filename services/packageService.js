const PAYMENT_STATUS = require("../constants/paymentStatus");
const {
  findAllPackages,
  findOverlappingBookings,
  findPackageById
} = require("../repositories/packageRepo");

// Check a single package
async function isAvailable(packageId, startDate, endDate) {
  const bookings = await findOverlappingBookings(
    packageId,
    startDate,
    endDate
  );

  return !bookings.some(b =>
    [PAYMENT_STATUS.PAID, PAYMENT_STATUS.DEPOSIT_PAID]
      .includes(b.payment_status)
  );
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

// GET PACKAGE BY ID
async function getPackageById(id) {

  const pkg = await findPackageById(id);

  if (!pkg) {
    throw new Error("Package not found");
  }

  return pkg;
}


module.exports = {   getAllPackagesAvailability,
  getPackageById,
  isAvailable };
