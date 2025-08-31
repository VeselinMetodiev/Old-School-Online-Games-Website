// controllers/gameController.js

const db = require("../db").db;
const sanitizeHTML = require("sanitize-html");

// Helper function for game validation
function sharedGameValidation(req) {
  const errors = [];

  if (typeof req.body.title !== "string") req.body.title = "";
  if (typeof req.body.description !== "string") req.body.description = "";
  if (typeof req.body.thumbnail_url !== "string") req.body.thumbnail_url = "";
  if (typeof req.body.game_url !== "string") req.body.game_url = "";

  req.body.title = sanitizeHTML(req.body.title.trim(), {
    allowedTags: [],
    allowedAttributes: {},
  });
  req.body.description = sanitizeHTML(req.body.description.trim(), {
    allowedTags: [],
    allowedAttributes: {},
  });
  req.body.thumbnail_url = sanitizeHTML(req.body.thumbnail_url.trim(), {
    allowedTags: [],
    allowedAttributes: {},
  });
  req.body.game_url = sanitizeHTML(req.body.game_url.trim(), {
    allowedTags: [],
    allowedAttributes: {},
  });

  if (!req.body.title) errors.push("You must provide a title.");
  if (!req.body.description) errors.push("You must provide a description.");
  if (!req.body.thumbnail_url) errors.push("You must provide a thumbnail URL.");
  if (!req.body.game_url) errors.push("You must provide a game URL.");

  return errors;
}

// Function to create a new game
function createGame(req, res) {
  const errors = sharedGameValidation(req);

  if (errors.length) {
    return res.render("create-game", { errors });
  }

  const ourStatement = db.prepare(
    "INSERT INTO games (title, description, thumbnail_url, gameLink, authorid, createdDate) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const result = ourStatement.run(
    req.body.title,
    req.body.description,
    req.body.thumbnail_url,
    req.body.game_url,
    req.user.userid,
    new Date().toISOString()
  );

  const newGame = db
    .prepare("SELECT * FROM games WHERE id = ?")
    .get(result.lastInsertRowid);
  res.redirect(`/game/${newGame.id}`);
}

// Function to view a single game
function viewSingleGame(req, res) {
  const statement = db.prepare(
    "SELECT games.*, users.username FROM games INNER JOIN users ON games.authorid = users.id WHERE games.id = ?"
  );
  const game = statement.get(req.params.id);

  if (!game) {
    return res.redirect("/");
  }

  const isAuthor = req.user && game.authorid === req.user.userid;

  res.render("single-game", { game, isAuthor });
}

// Function to display the edit game form
function viewEditGame(req, res) {
  const statement = db.prepare("SELECT * FROM games WHERE id = ?");
  const game = statement.get(req.params.id);

  if (!game) {
    return res.redirect("/");
  }
  if (game.authorid !== req.user.userid) {
    return res.redirect("/");
  }

  res.render("edit-game", { game });
}

// Function to handle the game update
function editGame(req, res) {
  const statement = db.prepare("SELECT * FROM games WHERE id = ?");
  const game = statement.get(req.params.id);

  if (!game) {
    return res.redirect("/");
  }
  if (game.authorid !== req.user.userid) {
    return res.redirect("/");
  }

  const errors = sharedGameValidation(req);

  if (errors.length) {
    return res.render("edit-game", { errors, game });
  }

  const updateStatement = db.prepare(
    "UPDATE games SET title = ?, description = ?, thumbnail_url = ?, gameLink = ? WHERE id = ?"
  );
  updateStatement.run(
    req.body.title,
    req.body.description,
    req.body.thumbnail_url,
    req.body.game_url,
    req.params.id
  );

  res.redirect(`/game/${req.params.id}`);
}

// Function to delete a game
function deleteGame(req, res) {
  const statement = db.prepare("SELECT * FROM games WHERE id = ?");
  const game = statement.get(req.params.id);

  if (!game) {
    return res.redirect("/");
  }
  if (game.authorid !== req.user.userid) {
    return res.redirect("/");
  }

  const deleteStatement = db.prepare("DELETE FROM games WHERE id = ?");
  deleteStatement.run(req.params.id);

  res.redirect("/dashboard");
}

module.exports = {
  createGame,
  viewSingleGame,
  viewEditGame,
  editGame,
  deleteGame,
};
