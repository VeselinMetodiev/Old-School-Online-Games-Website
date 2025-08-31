// controllers/postController.js

const db = require("../db").db;
const sanitizeHTML = require("sanitize-html");

// Helper function for post validation (can be moved to a separate validation file if complex)
function sharedPostValidation(req) {
  const errors = [];

  if (typeof req.body.title !== "string") req.body.title = "";
  if (typeof req.body.body !== "string") req.body.body = "";

  req.body.title = sanitizeHTML(req.body.title.trim(), {
    allowedTags: [],
    allowedAttributes: {},
  });
  req.body.body = sanitizeHTML(req.body.body.trim(), {
    allowedTags: [],
    allowedAttributes: {},
  });

  if (!req.body.title) errors.push("You must provide a title.");
  if (!req.body.body) errors.push("You must provide content.");

  return errors;
}

function createPost(req, res) {
  const errors = sharedPostValidation(req);

  if (errors.length) {
    return res.render("create-post", { errors });
  }

  const ourStatement = db.prepare(
    "INSERT INTO posts (title, body, authorid, createdDate) VALUES (?, ?, ?, ?)"
  );
  const result = ourStatement.run(
    req.body.title,
    req.body.body,
    req.user.userid,
    new Date().toISOString()
  );

  const getPostStatement = db.prepare("SELECT * FROM posts WHERE ROWID = ?");
  const realPost = getPostStatement.get(result.lastInsertRowid);

  res.redirect(`/post/${realPost.id}`);
}

function viewSinglePost(req, res) {
  const statement = db.prepare(
    "SELECT posts.*, users.username FROM posts INNER JOIN users ON posts.authorid = users.id WHERE posts.id = ?"
  );
  const post = statement.get(req.params.id);

  if (!post) {
    return res.redirect("/");
  }

  const isAuthor = req.user && post.authorid === req.user.userid;

  res.render("single-post", { post, isAuthor });
}

function viewEditPost(req, res) {
  const statement = db.prepare("SELECT * FROM posts WHERE id = ?");
  const post = statement.get(req.params.id);

  if (!post) {
    return res.redirect("/");
  }
  if (post.authorid !== req.user.userid) {
    return res.redirect("/");
  }

  res.render("edit-post", { post });
}

function editPost(req, res) {
  const statement = db.prepare("SELECT * FROM posts WHERE id = ?");
  const post = statement.get(req.params.id);

  if (!post) {
    return res.redirect("/");
  }
  if (post.authorid !== req.user.userid) {
    return res.redirect("/");
  }

  const errors = sharedPostValidation(req);

  if (errors.length) {
    return res.render("edit-post", { errors, post }); // Pass post object back to template on error
  }

  const updateStatement = db.prepare(
    "UPDATE posts SET title = ?, body = ? WHERE id = ?"
  );
  updateStatement.run(req.body.title, req.body.body, req.params.id);

  res.redirect(`/post/${req.params.id}`);
}

function deletePost(req, res) {
  const statement = db.prepare("SELECT * FROM posts WHERE id = ?");
  const post = statement.get(req.params.id);

  if (!post) {
    return res.redirect("/");
  }
  if (post.authorid !== req.user.userid) {
    return res.redirect("/");
  }

  const deleteStatement = db.prepare("DELETE FROM posts WHERE id = ?");
  deleteStatement.run(req.params.id);

  res.redirect("/dashboard"); // Redirect to dashboard after deletion
}

module.exports = {
  createPost,
  viewSinglePost,
  viewEditPost,
  editPost,
  deletePost,
};
