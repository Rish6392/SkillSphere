const cloudinary = require("cloudinary").v2;
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to upload file to cloudinary
const uploadToCloudinary = async (file, folder, quality) => {
  const options = { folder, resource_type: "auto" };
  if (quality) {
    options.quality = quality;
  }

  return await cloudinary.uploader.upload(file, options);
};

// Helper function to delete file from cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    throw error;
  }
};

module.exports = { cloudinary, uploadToCloudinary, deleteFromCloudinary };
