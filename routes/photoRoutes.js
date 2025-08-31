// routes/photoRoutes.js

const express = require("express");
const router = express.Router();
const photoController = require("../controllers/photoController");
const { mustBeLoggedIn } = require("../middleware/authMiddleware"); // Assuming photo uploads require login

const fs = require("fs");
const path = require("path");

router.get("/photos", (req, res) => {
  const uploadPath = path.join(__dirname, "..", "public", "uploads");

  fs.readdir(uploadPath, (err, files) => {
    if (err) {
      console.error("Could not read directory.", err);
      return res.status(500).send("Server Error");
    }

    // Filter for image files
    const imageFiles = files.filter((file) => {
      return [".jpg", ".jpeg", ".png", ".gif"].includes(
        path.extname(file).toLowerCase()
      );
    });

    res.render("photos", { photos: imageFiles });
  });
});

// Route to display the photo upload page
router.get("/upload-photo", mustBeLoggedIn, (req, res) => {
  // Add mustBeLoggedIn if only logged-in users can upload
  res.render("upload-photo"); // Render the EJS file for upload
});

// POST route for handling photo uploads
router.post("/upload-photo", mustBeLoggedIn, photoController.uploadPhoto); // Must be logged in to upload

// Route to view the photos gallery page (can be public or protected)
router.get("/photos", photoController.viewPhotosPage);

module.exports = router;
