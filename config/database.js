const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let dbInstance = null;

/**
 * Get or create the SQLite database instance.
 * @param {string} [customPath] - Optional custom DB path (useful for testing)
 * @returns {Database.Database} SQLite database instance
 */
function getDatabase(customPath) {
  if (dbInstance && !customPath) {
    return dbInstance;
  }

  // Determine database file path
  let dbPath;
  if (customPath) {
    dbPath = customPath;
  } else if (process.env.NODE_ENV === 'test') {
    dbPath = process.env.TEST_DB_FILE || ':memory:';
  } else {
    dbPath = process.env.DB_FILE || path.join(__dirname, '..', 'database', 'clinic.db');
  }

  // Ensure directory exists if using a file path
  if (dbPath !== ':memory:') {
    const dir = path.dirname(path.resolve(dbPath));
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new Database(dbPath, {
    verbose: process.env.DB_VERBOSE === 'true' ? console.log : null
  });

  // Enforce foreign key constraints
  db.pragma('foreign_keys = ON');
  
  // Use Write-Ahead Logging for better concurrency if not in memory
  if (dbPath !== ':memory:') {
    db.pragma('journal_mode = WAL');
  }

  if (!customPath) {
    dbInstance = db;
  }

  return db;
}

/**
 * Close current database connection.
 */
function closeDatabase() {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch (err) {
      // Ignore if already closed
    }
    dbInstance = null;
  }
}

/**
 * Set a mock or custom database instance (primarily for tests)
 */
function setDatabase(db) {
  dbInstance = db;
}

module.exports = {
  getDatabase,
  closeDatabase,
  setDatabase
};
