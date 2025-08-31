require("dotenv").config(); // Load environment variables
const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");

const app = express();

// Set up EJS as the view engine
app.set("view engine", "ejs");
// Specify views directory (optional if views is in root, but good practice)
app.set("views", path.join(__dirname, "views"));

// Serve static files (CSS, client-side JS, images, uploaded photos)
app.use(express.static("public"));
// This line needs to come BEFORE any routes that handle specific static files
// If you're serving 'uploads' from public, the line above covers it.
// Ensure your 'public' directory contains the 'uploads' folder for Multer.
const uploadsDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`'uploads' directory created at: ${uploadsDir}`);
} else {
  console.log(`'uploads' directory already exists at: ${uploadsDir}`);
}

// Middleware for parsing request bodies
app.use(express.urlencoded({ extended: false })); // For form data (application/x-www-form-urlencoded)
app.use(express.json()); // For JSON data (application/json)
app.use(cookieParser()); // For parsing cookies

// In dev (http), secure cookies must be OFF. In prod behind proxy/https:
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Import custom middleware
const commonMiddleware = require("./middleware/commonMiddleware.js");
const authMiddleware = require("./middleware/authMiddleware.js"); // Destructure if multiple exports
console.log(commonMiddleware.setLocals);
console.log(authMiddleware.decodeUserCookie);
// Apply global middleware
app.use(commonMiddleware.setLocals); // Sets res.locals.filterUserHTML and res.locals.errors
app.use(authMiddleware.decodeUserCookie); // Decodes JWT and sets req.user

// Import routes
const userRoutes = require("./routes/userRoutes");
const gameRoutes = require("./routes/gameRoutes");
const postRoutes = require("./routes/postRoutes");
const photoRoutes = require("./routes/photoRoutes");
const webRoutes = require("./routes/webRoutes"); // For general static page routes

// Use routes
app.use("/", webRoutes); // Handles home, games, photos, videos, etc.
app.use("/", userRoutes); // Handles login, register, logout
app.use("/", postRoutes); // Handles create-post, edit-post, delete-post, single-post
app.use("/", photoRoutes); // Handles photo upload functionality
app.use("/", gameRoutes); // Handles game upload functionality

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// Connect to database and create tables (from db.js)
const db = require("./db");
db.createTables();
console.log("Database tables checked/created.");

// 404 handler (placed last)
app.use((req, res) => {
  res.status(404).send("404 Not Found"); // Or render a 404 EJS page
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

app.use((req, res, next) => {
  const token = req.cookies?.ourSimpleApp;
  if (!token) return next();

  try {
    const payload = jwt.verify(token, process.env.JWTSECRET);
    // Make `user` available to all EJS templates
    res.locals.user = { id: payload.userid, username: payload.username };
  } catch (_) {
    // bad/expired token: ignore
  }
  next();
});
