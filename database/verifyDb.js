const { getDatabase } = require('../config/database');
const { bookingQueries } = require('./queries');

function verifyDatabase() {
  const db = getDatabase();

  console.log('====================================================');
  console.log('CLINIC HEALTH CENTRE - DATABASE VERIFICATION');
  console.log('====================================================');

  // 1. Verify table count
  const tables = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name ASC"
    )
    .all();

  console.log(`\n1. Tables found (${tables.length} tables):`);
  tables.forEach((t) => console.log(`   - ${t.name}`));
  if (tables.length === 3) {
    console.log('   ✓ Exactly 3 application tables verified: doctors, rooms, bookings');
  } else {
    console.error(`   ✗ Expected exactly 3 tables, but found ${tables.length}`);
  }

  // 2. Verify record counts
  const doctorCount = db.prepare('SELECT COUNT(*) as count FROM doctors').get().count;
  const roomCount = db.prepare('SELECT COUNT(*) as count FROM rooms').get().count;
  const activeRooms = db.prepare('SELECT COUNT(*) as count FROM rooms WHERE is_deleted = 0').get().count;
  const bookingCount = db.prepare('SELECT COUNT(*) as count FROM bookings').get().count;

  console.log('\n2. Record counts:');
  console.log(`   - Doctors: ${doctorCount}`);
  console.log(`   - Rooms: ${roomCount} (Active: ${activeRooms})`);
  console.log(`   - Bookings: ${bookingCount}`);

  // 3. Verify SQL JOIN
  console.log('\n3. SQL JOIN Verification (GET /bookings/details preview):');
  const joinResults = bookingQueries.getBookingDetails(db);
  console.log(`   - Total joined records: ${joinResults.length}`);
  if (joinResults.length > 0) {
    console.log('   - Sample joined row:');
    console.log(JSON.stringify(joinResults[0], null, 4));
  }

  // 4. Verify Indexes
  const indexes = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%' ORDER BY name ASC"
    )
    .all();
  console.log(`\n4. Indexes verified (${indexes.length}):`);
  indexes.forEach((idx) => console.log(`   - ${idx.name}`));

  console.log('====================================================');
  return {
    tableCount: tables.length,
    tables: tables.map((t) => t.name),
    doctorCount,
    roomCount,
    bookingCount,
    joinResultsCount: joinResults.length
  };
}

if (require.main === module) {
  verifyDatabase();
}

module.exports = { verifyDatabase };
