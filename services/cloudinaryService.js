const cloudinary = require("cloudinary").v2;
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

/**
 * Uploads a local file or buffer to Cloudinary
 * @param {string} filePath - path to the file (can be from multer)
 * @param {string} folder - optional folder name
 * @returns {string} secure_url of uploaded image
 */
const uploadImage = async (filePath, folder = "moments") => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      use_filename: true,
      unique_filename: false,
    });
    return result.secure_url;
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    throw err;
  }
};

module.exports = { uploadImage };
