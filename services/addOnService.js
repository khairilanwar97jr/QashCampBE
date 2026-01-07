const addOnRepo = require("../repositories/addOnRepo");

// Convert DB row to VO (frontend object)
function toVO(row) {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    imageUrl: row.image_url,
    available: row.avail === true,
  };
}

// Get all active add-ons
async function getAllActiveAddOns() {
  const items = await addOnRepo.getAllActiveAddOns();
  return items.map(toVO);
}

module.exports = {
  getAllActiveAddOns,
};
