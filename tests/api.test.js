const request = require('supertest');
const Database = require('better-sqlite3');
const app = require('../app');
const { setDatabase, closeDatabase } = require('../config/database');
const { initDb } = require('../database/initDb');
const { seedData } = require('../database/seedData');

describe('Clinic Health Centre - Complete REST API Endpoints', () => {
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

  // ==========================================
  // 1. DOCTORS API
  // ==========================================
  describe('DOCTORS API', () => {
    test('GET /doctors should return all 5 seeded doctors', async () => {
      const res = await request(app).get('/doctors');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(5);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('GET /doctors?specialization=... should filter doctors by specialization (search)', async () => {
      const res = await request(app).get('/doctors?specialization=Cardio');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('Dr. Sarah Jenkins');
      expect(res.body.data[0].specialization).toBe('Cardiology');
    });

    test('GET /doctors/:id should return single doctor by ID', async () => {
      const res = await request(app).get('/doctors/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Dr. Sarah Jenkins');
    });

    test('GET /doctors/:id should return 404 for non-existent doctor', async () => {
      const res = await request(app).get('/doctors/999');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    test('POST /doctors should create a new doctor', async () => {
      const newDoc = {
        name: 'Dr. Gregory House',
        specialization: 'Diagnostic Medicine'
      };

      const res = await request(app).post('/doctors').send(newDoc);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.name).toBe(newDoc.name);
      expect(res.body.data.specialization).toBe(newDoc.specialization);

      // Verify in DB
      const check = await request(app).get(`/doctors/${res.body.data.id}`);
      expect(check.status).toBe(200);
      expect(check.body.data.name).toBe(newDoc.name);
    });

    test('POST /doctors should return 400 for validation errors (missing or empty name)', async () => {
      const emptyNameRes = await request(app)
        .post('/doctors')
        .send({ name: '   ', specialization: 'Neurology' });
      expect(emptyNameRes.status).toBe(400);
      expect(emptyNameRes.body.success).toBe(false);

      const missingSpecRes = await request(app)
        .post('/doctors')
        .send({ name: 'Dr. Valid' });
      expect(missingSpecRes.status).toBe(400);
      expect(missingSpecRes.body.success).toBe(false);
    });

    test('PUT /doctors/:id should update existing doctor', async () => {
      const updateData = {
        name: 'Dr. Sarah Jenkins-Smith',
        specialization: 'Interventional Cardiology'
      };

      const res = await request(app).put('/doctors/1').send(updateData);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(updateData.name);
      expect(res.body.data.specialization).toBe(updateData.specialization);
    });

    test('PUT /doctors/:id should return 404 if doctor does not exist', async () => {
      const res = await request(app)
        .put('/doctors/999')
        .send({ name: 'Dr. Ghost', specialization: 'Radiology' });
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    test('DELETE /doctors/:id should prevent deletion if doctor has active bookings (409)', async () => {
      // Doctor 1 has bookings in seed data
      const res = await request(app).delete('/doctors/1');
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    test('DELETE /doctors/:id should delete doctor with no bookings', async () => {
      // Create doctor with no bookings
      const created = await request(app)
        .post('/doctors')
        .send({ name: 'Dr. Temp', specialization: 'Pathology' });
      const docId = created.body.data.id;

      const deleteRes = await request(app).delete(`/doctors/${docId}`);
      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);

      const verifyRes = await request(app).get(`/doctors/${docId}`);
      expect(verifyRes.status).toBe(404);
    });
  });

  // ==========================================
  // 2. ROOMS API & SEARCH
  // ==========================================
  describe('ROOMS API & SEARCH', () => {
    test('GET /rooms should return all active rooms', async () => {
      const res = await request(app).get('/rooms');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(5);
    });

    test('GET /rooms?floor=2 should return only active rooms on floor 2 (search)', async () => {
      const res = await request(app).get('/rooms?floor=2');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      res.body.data.forEach((room) => {
        expect(room.floor).toBe(2);
        expect(room.is_deleted).toBe(0);
      });
    });

    test('GET /rooms?floor=invalid should return 400 validation error', async () => {
      const res = await request(app).get('/rooms?floor=ground');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('POST /rooms should create a new room', async () => {
      const newRoom = { name: 'Emergency Room 1', floor: 1 };
      const res = await request(app).post('/rooms').send(newRoom);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(newRoom.name);
      expect(res.body.data.floor).toBe(newRoom.floor);
      expect(res.body.data.is_deleted).toBe(0);
    });

    test('POST /rooms should validate missing or invalid floor', async () => {
      const missingFloor = await request(app).post('/rooms').send({ name: 'Suite X' });
      expect(missingFloor.status).toBe(400);

      const invalidFloor = await request(app).post('/rooms').send({ name: 'Suite X', floor: 'top' });
      expect(invalidFloor.status).toBe(400);
    });

    test('PUT /rooms/:id should update room details', async () => {
      const res = await request(app)
        .put('/rooms/1')
        .send({ name: 'Consultation Room A - Renovated', floor: 1 });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Consultation Room A - Renovated');
    });
  });

  // ==========================================
  // 3. BOOKINGS API
  // ==========================================
  describe('BOOKINGS API', () => {
    test('GET /bookings should return all 10 seeded bookings', async () => {
      const res = await request(app).get('/bookings');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(10);
    });

    test('GET /bookings/:id should return single booking', async () => {
      const res = await request(app).get('/bookings/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(1);
    });

    test('GET /bookings/:id should return 404 for non-existent booking', async () => {
      const res = await request(app).get('/bookings/999');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    test('POST /bookings should create a new valid booking', async () => {
      const newBooking = {
        doctor_id: 1,
        room_id: 1,
        booking_date: '2026-12-01',
        booking_time: '14:00'
      };

      const res = await request(app).post('/bookings').send(newBooking);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.booking_date).toBe(newBooking.booking_date);
      expect(res.body.data.booking_time).toBe(newBooking.booking_time);
    });

    test('POST /bookings should reject booking with non-existent doctor (400)', async () => {
      const res = await request(app).post('/bookings').send({
        doctor_id: 999,
        room_id: 1,
        booking_date: '2026-12-02',
        booking_time: '10:00'
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/doctor with id 999 does not exist/i);
    });

    test('POST /bookings should reject booking with non-existent room (400)', async () => {
      const res = await request(app).post('/bookings').send({
        doctor_id: 1,
        room_id: 999,
        booking_date: '2026-12-02',
        booking_time: '10:00'
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/room with id 999 does not exist/i);
    });

    test('POST /bookings should prevent room conflict (same room, date, time) with 409', async () => {
      // Seed booking 1: doctor_id: 1, room_id: 1, '2026-11-20', '09:00'
      const conflictAttempt = {
        doctor_id: 2, // Different doctor
        room_id: 1,   // Same room
        booking_date: '2026-11-20',
        booking_time: '09:00'
      };

      const res = await request(app).post('/bookings').send(conflictAttempt);
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/conflict: room.*already booked/i);
    });

    test('POST /bookings should prevent doctor conflict (same doctor, date, time) with 409', async () => {
      // Seed booking 1: doctor_id: 1, room_id: 1, '2026-11-20', '09:00'
      const conflictAttempt = {
        doctor_id: 1, // Same doctor
        room_id: 3,   // Different room
        booking_date: '2026-11-20',
        booking_time: '09:00'
      };

      const res = await request(app).post('/bookings').send(conflictAttempt);
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/conflict: dr..*already has another booking/i);
    });

    test('POST /bookings should validate date format and calendar reality', async () => {
      const invalidDate = await request(app).post('/bookings').send({
        doctor_id: 1,
        room_id: 1,
        booking_date: '2026-02-31', // Non-existent date
        booking_time: '10:00'
      });
      expect(invalidDate.status).toBe(400);
      expect(invalidDate.body.success).toBe(false);
    });

    test('POST /bookings should validate time format (24-hour HH:MM)', async () => {
      const invalidTime = await request(app).post('/bookings').send({
        doctor_id: 1,
        room_id: 1,
        booking_date: '2026-11-25',
        booking_time: '25:70' // Invalid time
      });
      expect(invalidTime.status).toBe(400);
      expect(invalidTime.body.success).toBe(false);
    });

    test('PUT /bookings/:id should update booking details', async () => {
      const res = await request(app).put('/bookings/1').send({
        doctor_id: 1,
        room_id: 1,
        booking_date: '2026-12-05',
        booking_time: '16:00'
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.booking_date).toBe('2026-12-05');
      expect(res.body.data.booking_time).toBe('16:00');
    });

    test('DELETE /bookings/:id should delete booking successfully', async () => {
      const res = await request(app).delete('/bookings/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const check = await request(app).get('/bookings/1');
      expect(check.status).toBe(404);
    });
  });

  // ==========================================
  // 4. SQL JOIN (GET /bookings/details)
  // ==========================================
  describe('SQL JOIN - GET /bookings/details', () => {
    test('should join doctors, rooms, and bookings and return specified fields', async () => {
      const res = await request(app).get('/bookings/details');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(10);
      expect(Array.isArray(res.body.data)).toBe(true);

      // Verify the required fields on each joined record
      const firstRecord = res.body.data[0];
      expect(firstRecord).toHaveProperty('booking_id');
      expect(firstRecord).toHaveProperty('booking_date');
      expect(firstRecord).toHaveProperty('booking_time');
      expect(firstRecord).toHaveProperty('doctor_name');
      expect(firstRecord).toHaveProperty('specialization');
      expect(firstRecord).toHaveProperty('room_name');
      expect(firstRecord).toHaveProperty('floor');

      // Verify realistic data values
      expect(typeof firstRecord.doctor_name).toBe('string');
      expect(typeof firstRecord.room_name).toBe('string');
      expect(typeof firstRecord.floor).toBe('number');
    });
  });

  // ==========================================
  // 5. VALIDATION & ERROR HANDLING
  // ==========================================
  describe('Validation & Error Handling', () => {
    test('should return 400 for non-numeric ID parameter', async () => {
      const res = await request(app).get('/doctors/abc');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid id parameter/i);
    });

    test('should return 400 for negative ID parameter', async () => {
      const res = await request(app).get('/rooms/-5');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('should return 404 for unknown endpoint', async () => {
      const res = await request(app).get('/api/unknown');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/endpoint not found/i);
    });
  });
});
