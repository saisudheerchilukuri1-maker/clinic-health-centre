const { getDatabase } = require('../config/database');
const { initDb } = require('./initDb');

const sampleDoctors = [
  { name: 'Dr. Sarah Jenkins', specialization: 'Cardiology' },
  { name: 'Dr. Marcus Vance', specialization: 'Neurology' },
  { name: 'Dr. Elena Rostova', specialization: 'Pediatrics' },
  { name: 'Dr. Arjun Patel', specialization: 'Orthopedics' },
  { name: 'Dr. Chloe Bennett', specialization: 'Dermatology' }
];

const sampleRooms = [
  { name: 'Consultation Room A', floor: 1, is_deleted: 0 },
  { name: 'Consultation Room B', floor: 1, is_deleted: 0 },
  { name: 'Cardiology Suite', floor: 2, is_deleted: 0 },
  { name: 'Pediatric Clinic', floor: 2, is_deleted: 0 },
  { name: 'Minor Surgery Unit', floor: 3, is_deleted: 0 }
];

const sampleBookings = [
  { doctor_id: 1, room_id: 1, booking_date: '2026-11-20', booking_time: '09:00' },
  { doctor_id: 2, room_id: 2, booking_date: '2026-11-20', booking_time: '09:30' },
  { doctor_id: 3, room_id: 4, booking_date: '2026-11-20', booking_time: '10:00' },
  { doctor_id: 4, room_id: 3, booking_date: '2026-11-20', booking_time: '11:00' },
  { doctor_id: 5, room_id: 5, booking_date: '2026-11-20', booking_time: '14:00' },
  { doctor_id: 1, room_id: 3, booking_date: '2026-11-21', booking_time: '09:00' },
  { doctor_id: 2, room_id: 1, booking_date: '2026-11-21', booking_time: '10:30' },
  { doctor_id: 3, room_id: 4, booking_date: '2026-11-21', booking_time: '11:30' },
  { doctor_id: 4, room_id: 5, booking_date: '2026-11-22', booking_time: '13:00' },
  { doctor_id: 5, room_id: 2, booking_date: '2026-11-22', booking_time: '15:00' }
];

/**
 * Seeds sample data into the database in an idempotent manner.
 * @param {Database.Database} [db]
 */
function seedData(db) {
  const database = db || getDatabase();
  initDb(database);

  const seedTransaction = database.transaction(() => {
    // 1. Seed Doctors
    const insertDoctor = database.prepare(
      'INSERT INTO doctors (name, specialization) VALUES (?, ?)'
    );
    const countDoctors = database.prepare('SELECT COUNT(*) as count FROM doctors').get();
    if (countDoctors.count === 0) {
      for (const doc of sampleDoctors) {
        insertDoctor.run(doc.name, doc.specialization);
      }
    }

    // 2. Seed Rooms
    const insertRoom = database.prepare(
      'INSERT INTO rooms (name, floor, is_deleted) VALUES (?, ?, ?)'
    );
    const countRooms = database.prepare('SELECT COUNT(*) as count FROM rooms').get();
    if (countRooms.count === 0) {
      for (const room of sampleRooms) {
        insertRoom.run(room.name, room.floor, room.is_deleted);
      }
    }

    // 3. Seed Bookings
    const insertBooking = database.prepare(
      'INSERT INTO bookings (doctor_id, room_id, booking_date, booking_time) VALUES (?, ?, ?, ?)'
    );
    const countBookings = database.prepare('SELECT COUNT(*) as count FROM bookings').get();
    if (countBookings.count === 0) {
      for (const booking of sampleBookings) {
        insertBooking.run(
          booking.doctor_id,
          booking.room_id,
          booking.booking_date,
          booking.booking_time
        );
      }
    }
  });

  seedTransaction();

  const finalCounts = {
    doctors: database.prepare('SELECT COUNT(*) as count FROM doctors').get().count,
    rooms: database.prepare('SELECT COUNT(*) as count FROM rooms').get().count,
    bookings: database.prepare('SELECT COUNT(*) as count FROM bookings').get().count
  };

  return finalCounts;
}

// Allow standalone execution
if (require.main === module) {
  try {
    console.log('Seeding database with sample records...');
    const counts = seedData();
    console.log('✓ Database seeded successfully:');
    console.log(`  - Doctors: ${counts.doctors}`);
    console.log(`  - Rooms: ${counts.rooms}`);
    console.log(`  - Bookings: ${counts.bookings}`);
  } catch (error) {
    console.error('✗ Failed to seed database:', error.message);
    process.exit(1);
  }
}

module.exports = { seedData, sampleDoctors, sampleRooms, sampleBookings };
