// controllers/photoController.js

const db = require("../db").db;
const upload = require("../middleware/uploadMiddleware"); // Import the configured Multer instance
const path = require("path");

function uploadPhoto(req, res) {
  upload.single("photo")(req, res, (err) => {
    // 'photo' matches the name attribute in your HTML input
    if (err) {
      console.error(`Multer upload error: ${err.message}`);
      // Check if the error is from Multer (e.g., file size, file type)
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .send("Error: Image file size cannot exceed 5MB.");
      }
      if (err.message === "File upload only supports images!") {
        return res
          .status(400)
          .send("Error: Only image files (JPEG, JPG, PNG, GIF) are allowed.");
      }
      return res.status(400).send(`Error uploading file: ${err.message}`);
    }
    if (!req.file) {
      console.warn("No file received by Multer.");
      return res.status(400).send("No file selected for upload.");
    }

    console.log(`File uploaded successfully: ${req.file.filename}`);

    // Extract title and description from the form body
    const photoTitle = req.body["photo-title"] || null;
    const photoDescription = req.body["photo-description"] || null;
    const uploaderId = req.user ? req.user.userid : null; // Get uploader ID from JWT

    // Save photo metadata to the database
    try {
      const insertPhotoStatement = db.prepare(
        "INSERT INTO photos (filename, title, description, uploaderid, uploadedDate) VALUES (?, ?, ?, ?, ?)"
      );
      insertPhotoStatement.run(
        req.file.filename,
        photoTitle,
        photoDescription,
        uploaderId,
        new Date().toISOString()
      );
      console.log("Photo metadata saved to database.");
    } catch (dbErr) {
      console.error("Error saving photo metadata to database:", dbErr.message);
      // Optionally, clean up the uploaded file if DB save fails
      // fs.unlink(req.file.path, (unlinkErr) => {
      //     if (unlinkErr) console.error("Error deleting failed upload:", unlinkErr);
      // });
      return res
        .status(500)
        .send("Error saving photo information. Please try again.");
    }

    // Construct the URL where the image can be accessed
    const imageUrl = `/uploads/${req.file.filename}`;

    // Send a success response or redirect
    res.status(200).send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Upload Success</title>
                <link rel="stylesheet" href="/css/style.css">
            </head>
            <body>
                <div class="container">
                    <div class="content-wrapper">
                        <div class="left-column">
                            <div class="box">
                                <div class="box-title">Photo Uploaded Successfully!</div>
                                <p>Your photo is now available:</p>
                                <img src="${imageUrl}" alt="Uploaded Photo" style="max-width: 100%; height: auto; border: 1px solid #c0c0c0;">
                                <p><a href="/">Go back to home</a></p>
                                <p><a href="/upload-photo">Upload another photo</a></p>
                                <p><a href="/photos">View all photos</a></p>
                            </div>
                        </div>
                        <div class="right-column">
                            <div class="box">
                                <div class="box-title">Info</div>
                                <p>This is a placeholder for sidebar content.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `);
  });
}

function viewPhotosPage(req, res) {
  // Fetch all photos from the database to display on the photos page
  try {
    const photosStatement = db.prepare(
      "SELECT photos.*, users.username FROM photos LEFT JOIN users ON photos.uploaderid = users.id ORDER BY uploadedDate DESC"
    );
    const photos = photosStatement.all();
    res.render("photos", { photos });
  } catch (error) {
    console.error("Error fetching photos:", error.message);
    res.status(500).send("Error loading photos.");
  }
}

module.exports = {
  uploadPhoto,
  viewPhotosPage,
};
