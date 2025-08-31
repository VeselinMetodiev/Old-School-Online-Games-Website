// middleware/uploadMiddleware.js

const multer = require("multer");
const path = require("path");

// Determine the uploads directory relative to the project root
const uploadsDir = path.join(__dirname, "..", "public", "uploads");

// Set up Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Specify the directory where uploaded files will be stored
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename to avoid overwriting existing files
    // This example uses the current timestamp + original file extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// Initialize Multer with the storage configuration
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB (optional)
  fileFilter: function (req, file, cb) {
    // Only allow image files (optional)
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb("Error: File upload only supports images!");
  },
});

module.exports = upload; // Export the configured Multer instance
