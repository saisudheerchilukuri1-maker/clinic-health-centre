const { getDatabase } = require('../config/database');

/**
 * Doctor queries
 */
const doctorQueries = {
  findAll: (db, specialization) => {
    const database = db || getDatabase();
    if (specialization) {
      const stmt = database.prepare(
        'SELECT * FROM doctors WHERE LOWER(specialization) LIKE LOWER(?) ORDER BY id ASC'
      );
      return stmt.all(`%${specialization.trim()}%`);
    }
    const stmt = database.prepare('SELECT * FROM doctors ORDER BY id ASC');
    return stmt.all();
  },

  findById: (db, id) => {
    const database = db || getDatabase();
    const stmt = database.prepare('SELECT * FROM doctors WHERE id = ?');
    return stmt.get(id);
  },

  create: (db, name, specialization) => {
    const database = db || getDatabase();
    const stmt = database.prepare(
      'INSERT INTO doctors (name, specialization) VALUES (?, ?)'
    );
    const result = stmt.run(name.trim(), specialization.trim());
    return {
      id: result.lastInsertRowid,
      name: name.trim(),
      specialization: specialization.trim()
    };
  },

  update: (db, id, name, specialization) => {
    const database = db || getDatabase();
    const stmt = database.prepare(
      'UPDATE doctors SET name = ?, specialization = ? WHERE id = ?'
    );
    const result = stmt.run(name.trim(), specialization.trim(), id);
    if (result.changes === 0) return null;
    return { id, name: name.trim(), specialization: specialization.trim() };
  },

  delete: (db, id) => {
    const database = db || getDatabase();
    const stmt = database.prepare('DELETE FROM doctors WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
};

/**
 * Room queries (implements soft delete & search)
 */
const roomQueries = {
  findAllActive: (db, floor) => {
    const database = db || getDatabase();
    if (floor !== undefined && floor !== null && floor !== '') {
      const stmt = database.prepare(
        'SELECT * FROM rooms WHERE is_deleted = 0 AND floor = ? ORDER BY id ASC'
      );
      return stmt.all(Number(floor));
    }
    const stmt = database.prepare(
      'SELECT * FROM rooms WHERE is_deleted = 0 ORDER BY id ASC'
    );
    return stmt.all();
  },

  findByIdActive: (db, id) => {
    const database = db || getDatabase();
    const stmt = database.prepare(
      'SELECT * FROM rooms WHERE id = ? AND is_deleted = 0'
    );
    return stmt.get(id);
  },

  findByIdAny: (db, id) => {
    const database = db || getDatabase();
    const stmt = database.prepare('SELECT * FROM rooms WHERE id = ?');
    return stmt.get(id);
  },

  create: (db, name, floor) => {
    const database = db || getDatabase();
    const stmt = database.prepare(
      'INSERT INTO rooms (name, floor, is_deleted) VALUES (?, ?, 0)'
    );
    const result = stmt.run(name.trim(), Number(floor));
    return {
      id: result.lastInsertRowid,
      name: name.trim(),
      floor: Number(floor),
      is_deleted: 0
    };
  },

  update: (db, id, name, floor) => {
    const database = db || getDatabase();
    const stmt = database.prepare(
      'UPDATE rooms SET name = ?, floor = ? WHERE id = ? AND is_deleted = 0'
    );
    const result = stmt.run(name.trim(), Number(floor), id);
    if (result.changes === 0) return null;
    return { id, name: name.trim(), floor: Number(floor) };
  },

  softDelete: (db, id) => {
    const database = db || getDatabase();
    const stmt = database.prepare(
      'UPDATE rooms SET is_deleted = 1 WHERE id = ? AND is_deleted = 0'
    );
    const result = stmt.run(id);
    return result.changes > 0;
  },

  restore: (db, id) => {
    const database = db || getDatabase();
    const stmt = database.prepare(
      'UPDATE rooms SET is_deleted = 0 WHERE id = ? AND is_deleted = 1'
    );
    const result = stmt.run(id);
    return result.changes > 0;
  }
};

/**
 * Booking queries & conflict checks
 */
const bookingQueries = {
  findAll: (db) => {
    const database = db || getDatabase();
    const stmt = database.prepare('SELECT * FROM bookings ORDER BY booking_date ASC, booking_time ASC');
    return stmt.all();
  },

  findById: (db, id) => {
    const database = db || getDatabase();
    const stmt = database.prepare('SELECT * FROM bookings WHERE id = ?');
    return stmt.get(id);
  },

  create: (db, doctor_id, room_id, booking_date, booking_time) => {
    const database = db || getDatabase();
    const stmt = database.prepare(
      'INSERT INTO bookings (doctor_id, room_id, booking_date, booking_time) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(doctor_id, room_id, booking_date, booking_time);
    return {
      id: result.lastInsertRowid,
      doctor_id,
      room_id,
      booking_date,
      booking_time
    };
  },

  update: (db, id, doctor_id, room_id, booking_date, booking_time) => {
    const database = db || getDatabase();
    const stmt = database.prepare(
      'UPDATE bookings SET doctor_id = ?, room_id = ?, booking_date = ?, booking_time = ? WHERE id = ?'
    );
    const result = stmt.run(doctor_id, room_id, booking_date, booking_time, id);
    if (result.changes === 0) return null;
    return { id, doctor_id, room_id, booking_date, booking_time };
  },

  delete: (db, id) => {
    const database = db || getDatabase();
    const stmt = database.prepare('DELETE FROM bookings WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  checkRoomConflict: (db, room_id, booking_date, booking_time, excludeId = null) => {
    const database = db || getDatabase();
    let query = 'SELECT * FROM bookings WHERE room_id = ? AND booking_date = ? AND booking_time = ?';
    const params = [room_id, booking_date, booking_time];
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    const stmt = database.prepare(query);
    return stmt.get(...params);
  },

  checkDoctorConflict: (db, doctor_id, booking_date, booking_time, excludeId = null) => {
    const database = db || getDatabase();
    let query = 'SELECT * FROM bookings WHERE doctor_id = ? AND booking_date = ? AND booking_time = ?';
    const params = [doctor_id, booking_date, booking_time];
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    const stmt = database.prepare(query);
    return stmt.get(...params);
  },

  // SQL JOIN across doctors, rooms, and bookings
  getBookingDetails: (db) => {
    const database = db || getDatabase();
    const query = `
      SELECT 
        b.id AS booking_id,
        b.booking_date,
        b.booking_time,
        d.name AS doctor_name,
        d.specialization,
        r.name AS room_name,
        r.floor
      FROM bookings b
      JOIN doctors d ON b.doctor_id = d.id
      JOIN rooms r ON b.room_id = r.id
      ORDER BY b.booking_date ASC, b.booking_time ASC, b.id ASC
    `;
    const stmt = database.prepare(query);
    return stmt.all();
  }
};

module.exports = {
  doctorQueries,
  roomQueries,
  bookingQueries
};
