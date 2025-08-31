// routes/userRoutes.js

const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { mustBeLoggedIn } = require("../middleware/authMiddleware");
const db = require("../db").db; // Access db here if needed for dashboard data

router.post("/register", userController.register);
router.post("/login", userController.login);
router.get("/logout", userController.logout);

router.get("/login", (req, res) => {
  res.render("login");
});

router.get("/register", (req, res) => {
  res.render("register");
});

router.get("/user/:id", userController.viewSingleUser);

// GET /user/:userId/discussions
router.get("/user/:id/discussions", (req, res) => {
  const userId = req.params.id;

  const sql = `
      SELECT d.id AS discussion_id, d.title, d.author_id,
         r.id AS reply_id, r.user_id, r.text, r.created_at AS reply_created_at
  FROM discussions d
  LEFT JOIN replies r ON d.id = r.discussion_id
  WHERE d.author_id = ?
  ORDER BY d.id DESC, r.created_at ASC
  `;
  const rows = db.prepare(sql).all(userId);

  const discussions = [];
  const discussionMap = {};

  rows.forEach((row) => {
    if (!discussionMap[row.discussion_id]) {
      discussionMap[row.discussion_id] = {
        id: row.discussion_id,
        title: row.title,
        created_at: row.created_at,
        replies: [],
      };
      discussions.push(discussionMap[row.discussion_id]);
    }

    if (row.reply_id) {
      discussionMap[row.discussion_id].replies.push({
        id: row.reply_id,
        user_id: row.user_id,
        text: row.text,
        created_at: row.reply_created_at,
      });
    }
  });

  res.render("discussions", { userId, discussions });
});

// 🔹 Single discussion details
router.get("/user/:userId/discussions/:discussionId", (req, res) => {
  const { userId, discussionId } = req.params;

  // Get discussion info
  const discussion = db
    .prepare(
      `
    SELECT id, title, created_at FROM discussions WHERE id = ?
  `
    )
    .get(discussionId);

  if (!discussion) {
    return res.status(404).send("Discussion not found");
  }

  // Get replies
  const replies = db
    .prepare(
      `
    SELECT id, user_id, text, created_at
    FROM replies
    WHERE discussion_id = ?
    ORDER BY created_at ASC
  `
    )
    .all(discussionId);

  res.render("discussion-details", { userId, discussion, replies });
});

router.get("/dashboard", mustBeLoggedIn, (req, res) => {
  const postsStatement = db.prepare(
    "SELECT * FROM posts WHERE authorid = ? ORDER BY createdDate DESC"
  );
  const posts = postsStatement.all(req.user.userid);
  res.render("dashboard", { posts });
});

// Handle reply submission
router.post("/user/:userId/discussions/:discussionId/reply", (req, res) => {
  const { userId, discussionId } = req.params;
  const { text } = req.body;

  if (!text || text.trim() === "") {
    return res.status(400).send("Reply text cannot be empty");
  }

  db.prepare(
    `
    INSERT INTO replies (discussion_id, user_id, text)
    VALUES (?, ?, ?)
  `
  ).run(discussionId, userId, text);

  res.redirect(`/user/${userId}/discussions/${discussionId}`);
});

// Create a new discussion
router.post("/user/:userId/discussions", (req, res) => {
  const userId = req.params.userId;
  const { title } = req.body;

  if (!title || title.trim() === "") {
    return res.status(400).send("Discussion title cannot be empty");
  }

  db.prepare(
    `
    INSERT INTO discussions (title, author_id)
    VALUES (?, ?)
  `
  ).run(title.trim(), userId);

  res.redirect(`/user/${userId}/discussions`);
});

module.exports = router;
