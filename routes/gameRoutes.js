// router.js (or wherever your routes are defined)

const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const gameController = require("../controllers/gameController");
const { mustBeLoggedIn } = require("../middleware/authMiddleware");
const db = require("../db").db;

// Route for displaying the create game form
router.get("/create-game", (req, res) => {
  res.render("create-game");
});

// Game-related CRUD routes
router.post("/create-game", mustBeLoggedIn, gameController.createGame);
router.get("/game/:id", gameController.viewSingleGame);
router.get("/game/:id/edit", mustBeLoggedIn, gameController.viewEditGame);
router.post("/game/:id/edit", mustBeLoggedIn, gameController.editGame);
router.post("/game/:id/delete", mustBeLoggedIn, gameController.deleteGame);

// Main games page with categories + pagination
router.get("/games", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 6;
  const offset = (page - 1) * limit;

  const categorySlug = req.query.category || null;

  try {
    // 1) Fetch categories for left menu
    const categories = db
      .prepare("SELECT id, name, slug FROM categories")
      .all();

    // 2) Build WHERE filter if category selected
    let whereClause = "";
    let params = [];

    if (categorySlug) {
      const category = db
        .prepare("SELECT id, name FROM categories WHERE slug = ?")
        .get(categorySlug);

      if (category) {
        whereClause = "WHERE category_id = ?";
        params.push(category.id);
      }
    }

    // 3) Total games count (for pagination)
    const totalGames = db
      .prepare(`SELECT COUNT(*) AS total FROM games ${whereClause}`)
      .get(...params).total;

    const totalPages = Math.ceil(totalGames / limit);

    // 4) Fetch games for current page
    const games = db
      .prepare(
        `SELECT id, title, description, thumbnail_url AS thumbnail, slug 
         FROM games 
         ${whereClause}
         LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset);

    res.render("games", {
      games,
      categories,
      currentPage: page,
      totalPages,
      currentCategory: categorySlug,
      currentCategoryName:
        categorySlug && categories.find((c) => c.slug === categorySlug)?.name,
    });
  } catch (err) {
    console.error("Error fetching games:", err);
    res.status(500).send("Error fetching games");
  }
});

module.exports = router;
