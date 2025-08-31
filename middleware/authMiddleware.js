const jwt = require("jsonwebtoken");

// Decode JWT cookie and attach user info
function decodeUserCookie(req, res, next) {
  const token = req.cookies?.ourSimpleApp;

  if (!token) {
    req.user = null;
    res.locals.user = null; // templates and partials see null
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWTSECRET);
    req.user = decoded;
    res.locals.user = decoded; // only set if valid
  } catch (err) {
    req.user = null;
    res.locals.user = null;
  }

  next();
}

// Protect routes that require login
function mustBeLoggedIn(req, res, next) {
  if (req.user) return next();
  res.redirect("/"); // or /login
}

module.exports = { decodeUserCookie, mustBeLoggedIn };
