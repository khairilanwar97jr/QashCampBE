const PAYMENT_STATUS = require("../constants/paymentStatus");
const {
  findAllPackages,
  findOverlappingBookings,
  findPackageById,
  findBookingsForBlockedDates
} = require("../repositories/packageRepo");

const CLEANUP_DAYS = 2;
const PREPARATION_DAYS_BEFORE = 1;

function shiftDate(dateString, days) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

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

// Get calendar ranges that cannot be selected for one package.
async function getPackageBlockedDates(packageId, startDate, endDate) {
  const bookings = await findBookingsForBlockedDates(
    packageId,
    startDate,
    endDate
  );

  const blockedRanges = bookings
    .filter(booking =>
      [PAYMENT_STATUS.PAID]
        .includes(booking.payment_status)
    )
    .map(booking => ({
      startDate: shiftDate(booking.start_date, -PREPARATION_DAYS_BEFORE),
      endDate: shiftDate(booking.end_date, CLEANUP_DAYS)
    }));

  return {
    packageId,
    blockedRanges
  };
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
  getPackageBlockedDates,
  isAvailable };
