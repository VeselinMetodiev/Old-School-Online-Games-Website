// routes/postRoutes.js

const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const { mustBeLoggedIn } = require("../middleware/authMiddleware");

router.get("/create-post", mustBeLoggedIn, (req, res) => {
  res.render("create-post");
});
router.post("/create-post", mustBeLoggedIn, postController.createPost);

router.get("/post/:id", postController.viewSinglePost);

router.get("/edit-post/:id", mustBeLoggedIn, postController.viewEditPost);
router.post("/edit-post/:id", mustBeLoggedIn, postController.editPost);

router.post("/delete-post/:id", mustBeLoggedIn, postController.deletePost);

module.exports = router;
