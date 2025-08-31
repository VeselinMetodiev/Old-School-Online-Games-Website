// db.js

const db = require("better-sqlite3")(process.env.DB_PATH);
db.pragma("journal_mode = WAL");

const createTables = db.transaction(() => {
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username STRING NOT NULL UNIQUE,
    password STRING NOT NULL
    )
    `
  ).run();

  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);`
  ).run();

  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS discussions (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`
  ).run();

  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS replies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  discussion_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (discussion_id) REFERENCES discussions(id)
);`
  ).run();

  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    createdDate TEXT,
    title STRING NOT NULL,
    body TEXT NOT NULL,
    authorid INTEGER,
    FOREIGN KEY (authorid) REFERENCES users (id)
    )
  `
  ).run();

  // Add a table for photos
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        title TEXT,
        description TEXT,
        uploaderid INTEGER,
        uploadedDate TEXT,
        FOREIGN KEY (uploaderid) REFERENCES users (id)
    )
    `
  ).run();
});

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    gameLink TEXT,
    thumbnail_url VARCHAR(255),
    authorid INTEGER,
    createdDate TEXT
);
    `
).run();

module.exports = { db, createTables };
