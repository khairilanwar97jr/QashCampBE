const checklistRepo = require("../repositories/checklistRepo");

class ChecklistError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = "ChecklistError";
    this.statusCode = statusCode;
  }
}

async function getTentChecklist(bookingRef, repository = checklistRepo) {
  const booking = await repository.getBookingPackageByRef(bookingRef);

  if (!booking) {
    throw new ChecklistError("Booking not found", 404);
  }

  if (booking.package_id == null) {
    throw new ChecklistError(
      "No package is linked to this booking",
      404
    );
  }

  if (!booking.package) {
    throw new ChecklistError("Package not found", 404);
  }

  const [packageItems, bookingAddOns] = await Promise.all([
    repository.getActivePackageItems(booking.package_id),
    repository.getActiveBookingAddOns(booking.id),
  ]);

  return {
    success: true,
    package: {
      id: booking.package.id,
      name: booking.package.name,
    },
    items: packageItems.map((packageItem) => ({
      id: packageItem.item.id,
      name: packageItem.item.name,
      imageUrl: packageItem.item.image_url,
      description: packageItem.item.description,
      quantity: packageItem.expected_quantity,
    })),
    addOns: bookingAddOns
      .filter(
        (reservation) =>
          Number(reservation.status) === 1 &&
          Number(reservation.add_on_item?.status) === 1
      )
      .map((reservation) => ({
        id: reservation.add_on_item.id,
        name: reservation.add_on_item.name,
        imageUrl: reservation.add_on_item.image_url,
        quantity: reservation.quantity,
      })),
  };
}

module.exports = { getTentChecklist };
