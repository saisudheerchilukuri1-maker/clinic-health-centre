const { getDatabase } = require('../config/database');

/**
 * Initializes the SQLite schema: creates tables and indexes.
 * @param {Database.Database} [db] - Optional database instance
 * @returns {Database.Database}
 */
function initDb(db) {
  const database = db || getDatabase();

  database.exec(`
    -- Enable foreign keys
    PRAGMA foreign_keys = ON;

    -- 1. DOCTORS Table
    CREATE TABLE IF NOT EXISTS doctors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      specialization TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. ROOMS Table
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      floor INTEGER NOT NULL,
      is_deleted INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 3. BOOKINGS Table
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doctor_id INTEGER NOT NULL,
      room_id INTEGER NOT NULL,
      booking_date TEXT NOT NULL,
      booking_time TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE RESTRICT,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT
    );

    -- Indexes
    -- Prevent conflicting bookings for the same room, date and time
    CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_room_datetime 
      ON bookings (room_id, booking_date, booking_time);

    -- Index for doctor scheduling lookup
    CREATE INDEX IF NOT EXISTS idx_bookings_doctor_datetime 
      ON bookings (doctor_id, booking_date, booking_time);

    -- Index for floor search
    CREATE INDEX IF NOT EXISTS idx_rooms_floor 
      ON rooms (floor);

    -- Index for soft-delete filtering
    CREATE INDEX IF NOT EXISTS idx_rooms_is_deleted 
      ON rooms (is_deleted);

    -- Index for doctor specialization search
    CREATE INDEX IF NOT EXISTS idx_doctors_specialization 
      ON doctors (specialization);
  `);

  return database;
}

// Allow standalone execution
if (require.main === module) {
  try {
    console.log('Initializing Clinic Health Centre database tables...');
    initDb();
    console.log('✓ Database tables and indexes created successfully.');
  } catch (error) {
    console.error('✗ Failed to initialize database:', error.message);
    process.exit(1);
  }
}

module.exports = { initDb };
