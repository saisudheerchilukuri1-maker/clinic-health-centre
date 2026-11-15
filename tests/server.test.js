const request = require('supertest');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const app = require('../app');
const { initDb } = require('../database/initDb');
const { setDatabase, closeDatabase, getDatabase } = require('../config/database');

describe('Clinic Health Centre - Server, Health & Persistence', () => {
  const tempDbPath = path.join(__dirname, 'test_persistence.db');

  beforeEach(() => {
    // Clean up any existing temp file
    if (fs.existsSync(tempDbPath)) {
      try {
        fs.unlinkSync(tempDbPath);
      } catch (e) {}
    }
  });

  afterEach(() => {
    closeDatabase();
    if (fs.existsSync(tempDbPath)) {
      try {
        fs.unlinkSync(tempDbPath);
      } catch (e) {}
    }
  });

  test('GET /health should return 200 and operational status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
    expect(res.body.service).toBe('Clinic Health Centre API');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('timestamp');
  });

  test('GET /non-existent-endpoint should return 404 with structured JSON', async () => {
    const res = await request(app).get('/some/missing/route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/endpoint not found/i);
  });

  test('Database persistence: data saved to file survives database connection reopen', () => {
    // 1. Open persistent DB file and initialize
    const db1 = new Database(tempDbPath);
    db1.pragma('foreign_keys = ON');
    initDb(db1);

    // 2. Insert records
    db1.prepare('INSERT INTO doctors (name, specialization) VALUES (?, ?)').run(
      'Dr. Persistent',
      'Oncology'
    );
    db1.prepare('INSERT INTO rooms (name, floor) VALUES (?, ?)').run('Room 501', 5);

    // 3. Close connection
    db1.close();

    // 4. Reopen the same file
    const db2 = new Database(tempDbPath);
    const doctor = db2.prepare('SELECT * FROM doctors WHERE name = ?').get('Dr. Persistent');
    const room = db2.prepare('SELECT * FROM rooms WHERE name = ?').get('Room 501');

    expect(doctor).toBeDefined();
    expect(doctor.name).toBe('Dr. Persistent');
    expect(doctor.specialization).toBe('Oncology');

    expect(room).toBeDefined();
    expect(room.name).toBe('Room 501');
    expect(room.floor).toBe(5);

    db2.close();
  });
});
