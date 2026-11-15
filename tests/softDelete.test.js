const request = require('supertest');
const Database = require('better-sqlite3');
const app = require('../app');
const { setDatabase, closeDatabase } = require('../config/database');
const { initDb } = require('../database/initDb');
const { seedData } = require('../database/seedData');

describe('Clinic Health Centre - Soft Delete & Restore (Mandatory Assignment Specification)', () => {
  let db;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    initDb(db);
    seedData(db);
    setDatabase(db);
  });

  afterEach(() => {
    closeDatabase();
  });

  test('MANDATORY 4-STEP CYCLE: DELETE /rooms/3 -> GET /rooms/3 -> POST /rooms/3/restore -> GET /rooms/3', async () => {
    // Verify room 3 exists initially and is active
    const initialCheck = await request(app).get('/rooms/3');
    expect(initialCheck.status).toBe(200);
    expect(initialCheck.body.success).toBe(true);
    expect(initialCheck.body.data.id).toBe(3);
    expect(initialCheck.body.data.is_deleted).toBe(0);

    // STEP 1: DELETE /rooms/3 → 200 OK
    const deleteRes = await request(app).delete('/rooms/3');
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);
    expect(deleteRes.body.message).toMatch(/soft-deleted successfully/i);

    // Verify room is still present in database file (not permanently deleted)
    const rawRecord = db.prepare('SELECT * FROM rooms WHERE id = 3').get();
    expect(rawRecord).toBeDefined();
    expect(rawRecord.id).toBe(3);
    expect(rawRecord.is_deleted).toBe(1);

    // STEP 2: GET /rooms/3 → 404 Not Found
    const getDeletedRes = await request(app).get('/rooms/3');
    expect(getDeletedRes.status).toBe(404);
    expect(getDeletedRes.body.success).toBe(false);

    // Also verify GET /rooms (list) does NOT show room 3
    const listRes = await request(app).get('/rooms');
    expect(listRes.status).toBe(200);
    const roomIdsInList = listRes.body.data.map((r) => r.id);
    expect(roomIdsInList).not.toContain(3);

    // STEP 3: POST /rooms/3/restore → 200 OK
    const restoreRes = await request(app).post('/rooms/3/restore');
    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.success).toBe(true);
    expect(restoreRes.body.message).toMatch(/restored successfully/i);
    expect(restoreRes.body.data.is_deleted).toBe(0);

    // STEP 4: GET /rooms/3 → 200 OK
    const getRestoredRes = await request(app).get('/rooms/3');
    expect(getRestoredRes.status).toBe(200);
    expect(getRestoredRes.body.success).toBe(true);
    expect(getRestoredRes.body.data.id).toBe(3);
    expect(getRestoredRes.body.data.is_deleted).toBe(0);

    // Verify GET /rooms now contains room 3 again
    const finalListRes = await request(app).get('/rooms');
    expect(finalListRes.status).toBe(200);
    const updatedIds = finalListRes.body.data.map((r) => r.id);
    expect(updatedIds).toContain(3);
  });

  test('should return 404 when trying to soft-delete an already deleted room', async () => {
    // Delete room 3
    await request(app).delete('/rooms/3');

    // Attempting to delete again should return 404
    const secondDelete = await request(app).delete('/rooms/3');
    expect(secondDelete.status).toBe(404);
    expect(secondDelete.body.success).toBe(false);
  });

  test('should return 404 when restoring non-existent room ID', async () => {
    const res = await request(app).post('/rooms/999/restore');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('should return 200 and message if restoring an already active room', async () => {
    const res = await request(app).post('/rooms/1/restore');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/already active/i);
  });

  test('should reject booking creation for a soft-deleted room', async () => {
    // Soft-delete room 2
    await request(app).delete('/rooms/2');

    // Attempt to book room 2
    const res = await request(app)
      .post('/bookings')
      .send({
        doctor_id: 1,
        room_id: 2,
        booking_date: '2026-11-30',
        booking_time: '10:00'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/does not exist or has been deleted/i);
  });
});
