const addOnRepo = require("../repositories/addOnRepo");

// Convert DB row to VO (frontend object)
function toVO(row) {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    imageUrl: row.image_url,
    available: row.avail === true,
    quantity: row.max_quantity,
  };
}

// Get all active add-ons
async function getAllActiveAddOns() {
  const items = await addOnRepo.getAllActiveAddOns();
  return items.map(toVO);
}

async function getAddOnAvailability(startDate, endDate) {
  const [items, reservedQuantities] = await Promise.all([
    addOnRepo.getAllActiveAddOns(),
    addOnRepo.getReservedQuantities(startDate, endDate),
  ]);

  return items.map((row) => {
    const maxQuantity = Number(row.max_quantity || 0);
    const reservedQuantity = reservedQuantities[Number(row.id)] || 0;
    const availableQuantity = Math.max(0, maxQuantity - reservedQuantity);

    return {
      ...toVO(row),
      reservedQuantity,
      availableQuantity,
      available: row.avail === true && availableQuantity > 0,
    };
  });
}

module.exports = {
  getAllActiveAddOns,
  getAddOnAvailability,
};
