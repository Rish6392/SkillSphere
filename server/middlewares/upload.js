const multer = require("multer");
const { cloudinary } = require("../config/cloudinary");
const { Readable } = require("stream");

// Multer memory storage (files stored in memory buffer before uploading to Cloudinary)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = {
    image: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
    document: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    video: ["video/mp4", "video/mpeg", "video/quicktime"],
  };

  const allAllowed = [
    ...allowedTypes.image,
    ...allowedTypes.document,
    ...allowedTypes.video,
  ];

  if (allAllowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed.`), false);
  }
};

// Multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max
  },
});

// ==========================================
// Upload buffer to Cloudinary
// ==========================================
const uploadToCloudinary = (buffer, folder, resourceType = "auto") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `skillsphere/${folder}`,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
};

// ==========================================
// Delete from Cloudinary
// ==========================================
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw error;
  }
};

module.exports = { upload, uploadToCloudinary, deleteFromCloudinary };
