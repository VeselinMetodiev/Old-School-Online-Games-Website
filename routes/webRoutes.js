// routes/webRoutes.js

const express = require("express");
const router = express.Router();
const db = require("../db").db; // Access db here if needed for dashboard data

router.get("/", (req, res) => {
  console.log("home user:", res.locals.user); // should be undefined after logout
  const stmt = db.prepare(`
    SELECT d.id, d.title, d.created_at, d.author_id,
           MAX(r.created_at) AS latest_reply
    FROM discussions d
    LEFT JOIN replies r ON d.id = r.discussion_id
    GROUP BY d.id
    ORDER BY latest_reply DESC, d.created_at DESC
    LIMIT 10
  `);

  const discussions = stmt.all(); // returns array of discussions

  res.render("homepage", { discussions });
});

// router.get("/games", (req, res) => {
//   res.render("games");
// });

// NOTE: '/photos' route is now handled in photoRoutes.js for database fetching

router.get("/videos", (req, res) => {
  res.render("videos");
});

router.get("/game", (req, res) => {
  res.render("game");
});

router.get("/users", (req, res) => {
  res.render("users");
});

router.get("/user", (req, res) => {
  res.render("user");
});

router.get("/forest", (req, res) => {
  res.render("forest");
});

router.get("/gorata", (req, res) => {
  res.render("gorata");
});

router.get("/aquarium", (req, res) => {
  res.render("aquarium");
});

router.get("/index", (req, res) => {
  res.render("index");
});

module.exports = router;
