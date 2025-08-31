// middleware/commonMiddleware.js

const sanitizeHTML = require("sanitize-html");
const marked = require("marked");

function setLocals(req, res, next) {
  // Make our markdown function available to EJS templates
  res.locals.filterUserHTML = function (content) {
    return sanitizeHTML(marked.parse(content), {
      allowedTags: [
        "p",
        "br",
        "ul",
        "li",
        "ol",
        "strong",
        "bold",
        "i",
        "em",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
      ],
      allowedAttributes: {},
    });
  };

  // Initialize errors array for templates
  res.locals.errors = [];
  next();
}

module.exports = {
  setLocals,
  // You might move decodeUserCookie here as well if you prefer
  // to group all `res.locals` and cookie handling
  // but separating auth is often clearer.
};
