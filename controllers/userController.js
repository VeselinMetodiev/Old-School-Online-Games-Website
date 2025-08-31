const db = require("../db").db; // Access the database instance
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sanitizeHTML = require("sanitize-html");

function register(req, res) {
  const errors = [];

  const username = (req.body?.username).trim();
  const password = req.body?.password;

  // Username validation
  if (!username) errors.push("You must provide a username.");
  if (username && username.length < 3)
    errors.push("Username must be at least 3 characters.");
  if (username && username.length > 10)
    errors.push("Username cannot exceed 10 characters.");
  if (username && !/^[a-zA-Z0-9]+$/.test(username))
    errors.push("Username can only contain letters and numbers.");

  // Uniqueness check
  try {
    const exists = db
      .prepare("SELECT 1 FROM users WHERE username = ?")
      .get(username);
    if (exists) errors.push("That username is already taken.");
  } catch (e) {
    console.error("Username check failed:", e);
    errors.push("Unexpected database error. Try again.");
  }

  // Password validation
  if (!password) errors.push("You must provide a password.");
  if (password && password.length < 12)
    errors.push("Password must be at least 12 characters.");
  if (password && password.length > 70)
    errors.push("Password cannot exceed 70 characters.");

  // If any errors, show them (don’t silently redirect)
  if (errors.length) {
    console.log(errors);
    return res.render("register", { errors });
  }

  // Hash + insert
  const hash = bcrypt.hashSync(password, 10);

  try {
    const insert = db.prepare(
      "INSERT INTO users (username, password) VALUES (?, ?)"
    );
    const result = insert.run(username, hash);

    if (result.changes !== 1) {
      console.error("Insert did not change any rows:", result);
      return res.render("homepage", {
        errors: ["Registration failed. Please try again."],
      });
    }

    const user = { id: result.lastInsertRowid, username };

    const token = jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24h
        userid: user.id,
        username: user.username,
      },
      process.env.JWTSECRET
    );

    res.cookie("ourSimpleApp", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // dev over http => false
      sameSite: "strict",
      maxAge: process.env.JWT_EXPIRATION,
      path: "/",
    });

    // On success we redirect; middleware above will populate res.locals.user
    return res.redirect("/");
  } catch (err) {
    console.error("Register insert failed:", err);
    return res.render("homepage", { errors: ["Registration failed."] });
  }
}

function login(req, res) {
  let errors = [];

  if (typeof req.body.username !== "string") req.body.username = "";
  if (typeof req.body.password !== "string") req.body.password = "";

  if (req.body.username.trim() == "") errors = ["Invalid username / password."];
  if (req.body.password == "") errors = ["Invalid username / password."];

  if (errors.length) {
    return res.render("login", { errors });
  }

  const userInQuestionStatement = db.prepare(
    "SELECT * FROM users WHERE USERNAME = ?"
  );
  const userInQuestion = userInQuestionStatement.get(req.body.username);

  if (!userInQuestion) {
    errors = ["Invalid username / password."];
    return res.render("login", { errors });
  }

  const matchOrNot = bcrypt.compareSync(
    req.body.password,
    userInQuestion.password
  );
  if (!matchOrNot) {
    errors = ["Invalid username / password."];
    return res.render("login", { errors });
  }

  const ourTokenValue = jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
      skyColor: "blue",
      userid: userInQuestion.id,
      username: userInQuestion.username,
    },
    process.env.JWTSECRET
  );

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: process.env.JWT_EXPIRATION,
    path: "/",
  };

  res.cookie("ourSimpleApp", ourTokenValue, cookieOptions);

  res.redirect("/");
}

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
};

function logout(req, res) {
  res.clearCookie("ourSimpleApp", cookieOptions);
  res.redirect("/");
}

/**
 * Controller function to view a single user's profile by ID.
 * This version uses a prepared statement, similar to postController.js.
 * @param {object} req - The request object from Express.
 * @param {object} res - The response object from Express.
 */
function viewSingleUser(req, res) {
  const statement = db.prepare("SELECT id, username FROM users WHERE id = ?");

  const user = statement.get(req.params.id);

  if (!user) {
    return res.redirect("/");
  }

  res.render("user", { user });
}

module.exports = {
  register,
  login,
  logout,
  viewSingleUser,
};
