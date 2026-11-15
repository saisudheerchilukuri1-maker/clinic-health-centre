const Database = require('better-sqlite3');
const { initDb } = require('../database/initDb');
const { doctorQueries, roomQueries, bookingQueries } = require('../database/queries');

describe('Clinic Health Centre - Database Architecture & Constraints', () => {
  let db;

  beforeEach(() => {
    // Create an isolated in-memory database for each test suite
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    initDb(db);
  });

  afterEach(() => {
    if (db) {
      db.close();
    }
  });

  test('should create exactly three application tables: doctors, rooms, bookings', () => {
    const tablesStmt = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name ASC"
    );
    const tables = tablesStmt.all().map((t) => t.name);

    expect(tables).toHaveLength(3);
    expect(tables).toEqual(['bookings', 'doctors', 'rooms']);
  });

  test('should enforce foreign key constraint on bookings (doctor_id)', () => {
    // Insert valid room
    const room = roomQueries.create(db, 'Room 101', 1);

    // Attempt to insert booking with invalid doctor_id (999)
    expect(() => {
      bookingQueries.create(db, 999, room.id, '2026-11-20', '10:00');
    }).toThrow(/FOREIGN KEY constraint failed/);
  });

  test('should enforce foreign key constraint on bookings (room_id)', () => {
    // Insert valid doctor
    const doc = doctorQueries.create(db, 'Dr. John Doe', 'Cardiology');

    // Attempt to insert booking with invalid room_id (999)
    expect(() => {
      bookingQueries.create(db, doc.id, 999, '2026-11-20', '10:00');
    }).toThrow(/FOREIGN KEY constraint failed/);
  });

  test('should prevent duplicate bookings for the same room, date, and time via unique index', () => {
    const doc1 = doctorQueries.create(db, 'Dr. Alice', 'General Medicine');
    const doc2 = doctorQueries.create(db, 'Dr. Bob', 'Pediatrics');
    const room = roomQueries.create(db, 'Consultation A', 1);

    // First booking succeeds
    const booking1 = bookingQueries.create(db, doc1.id, room.id, '2026-11-20', '14:00');
    expect(booking1.id).toBeDefined();

    // Second booking with different doctor but same room, date, and time must fail
    expect(() => {
      bookingQueries.create(db, doc2.id, room.id, '2026-11-20', '14:00');
    }).toThrow(/UNIQUE constraint failed/);
  });

  test('should verify required indexes are present in database', () => {
    const indexStmt = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%' ORDER BY name ASC"
    );
    const indexes = indexStmt.all().map((idx) => idx.name);

    expect(indexes).toContain('idx_bookings_room_datetime');
    expect(indexes).toContain('idx_bookings_doctor_datetime');
    expect(indexes).toContain('idx_doctors_specialization');
    expect(indexes).toContain('idx_rooms_floor');
    expect(indexes).toContain('idx_rooms_is_deleted');
  });

  test('should support parameterized search on doctors specialization', () => {
    doctorQueries.create(db, 'Dr. Smith', 'Cardiology');
    doctorQueries.create(db, 'Dr. Adams', 'Pediatric Cardiology');
    doctorQueries.create(db, 'Dr. Taylor', 'Neurology');

    const cardioDoctors = doctorQueries.findAll(db, 'Cardiology');
    expect(cardioDoctors).toHaveLength(2);

    const neuroDoctors = doctorQueries.findAll(db, 'neuro');
    expect(neuroDoctors).toHaveLength(1);
    expect(neuroDoctors[0].name).toBe('Dr. Taylor');
  });

  test('should support floor search and soft delete filtering on rooms', () => {
    const r1 = roomQueries.create(db, 'Room 1A', 1);
    const r2 = roomQueries.create(db, 'Room 1B', 1);
    const r3 = roomQueries.create(db, 'Room 2A', 2);

    // Active rooms on floor 1
    const floor1Rooms = roomQueries.findAllActive(db, 1);
    expect(floor1Rooms).toHaveLength(2);

    // Soft delete r1
    roomQueries.softDelete(db, r1.id);

    // Active rooms on floor 1 should now be 1
    const floor1AfterDelete = roomQueries.findAllActive(db, 1);
    expect(floor1AfterDelete).toHaveLength(1);
    expect(floor1AfterDelete[0].id).toBe(r2.id);

    // Restoring r1 brings it back
    roomQueries.restore(db, r1.id);
    const floor1AfterRestore = roomQueries.findAllActive(db, 1);
    expect(floor1AfterRestore).toHaveLength(2);
  });

  test('should execute 3-table SQL JOIN correctly', () => {
    const doc = doctorQueries.create(db, 'Dr. Watson', 'Diagnostics');
    const room = roomQueries.create(db, 'Consultation Suite 4', 3);
    const booking = bookingQueries.create(db, doc.id, room.id, '2026-11-25', '11:00');

    const details = bookingQueries.getBookingDetails(db);
    expect(details.length).toBeGreaterThanOrEqual(1);

    const match = details.find((d) => d.booking_id === booking.id);
    expect(match).toBeDefined();
    expect(match.doctor_name).toBe('Dr. Watson');
    expect(match.specialization).toBe('Diagnostics');
    expect(match.room_name).toBe('Consultation Suite 4');
    expect(match.floor).toBe(3);
    expect(match.booking_date).toBe('2026-11-25');
    expect(match.booking_time).toBe('11:00');
  });
});
