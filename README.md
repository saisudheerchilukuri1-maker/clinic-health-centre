# Clinic Health Centre – Complete Backend REST API

A modular, robust, and professional REST API backend built from scratch for **Clinic Health Centre** using Node.js, Express.js, and SQLite (`better-sqlite3`).

---

## 1. Project Introduction
Clinic Health Centre is a centralized backend management system designed to streamline healthcare clinic workflows. It facilitates the administration of doctor profiles, clinical rooms across various building floors, and patient appointments/bookings, ensuring zero scheduling overlaps, robust data integrity, and safe archival through soft-deletion.

---

## 2. Problem Statement
Manual appointment scheduling in outpatient clinics often leads to double-booking rooms or medical staff, inefficient room allocation across different floors, accidental permanent data deletion, and lack of real-time scheduling visibility. 

Clinic Health Centre resolves these issues by implementing:
- Automated scheduling conflict detection for both rooms and doctors.
- Foreign key enforcement at the database layer.
- Soft delete and restore capabilities so historical records are never permanently lost.
- Instant search filters by doctor specialization and room floor.
- A 3-table relational SQL JOIN endpoint for complete appointment visibility.

---

## 3. Objectives
- **Data Integrity:** Enforce foreign key constraints across doctors, rooms, and bookings.
- **Conflict Prevention:** Prevent room double-booking on identical date and time slots using database unique indexes and application validation.
- **Archival Safety:** Implement soft-delete and restore on clinical rooms (`is_deleted` flag).
- **Relational Reporting:** Provide a multi-table SQL JOIN endpoint returning booking, doctor, and room metadata in one query.
- **Automated Verification:** Comprehensive test suite with 100% pass rate using Jest and Supertest.

---

## 4. Technologies
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js (v4)
- **Database:** SQLite3 via `better-sqlite3` (synchronous, high-performance SQLite engine)
- **Testing:** Jest & Supertest
- **API Testing:** Postman (Collection v2.1.0)
- **Environment Management:** `dotenv` & `cross-env`

---

## 5. Database Schema & Architecture

The database consists of **exactly three related tables**:

### A. `doctors`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique doctor ID |
| `name` | TEXT | NOT NULL | Doctor full name |
| `specialization` | TEXT | NOT NULL | Medical specialty |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Registration timestamp |

### B. `rooms`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique room ID |
| `name` | TEXT | NOT NULL | Room designation name |
| `floor` | INTEGER | NOT NULL | Building floor number |
| `is_deleted` | INTEGER | DEFAULT 0 | Soft-delete flag (0 = active, 1 = deleted) |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

### C. `bookings`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique booking ID |
| `doctor_id` | INTEGER | NOT NULL, FK -> doctors(id) | Assigned doctor |
| `room_id` | INTEGER | NOT NULL, FK -> rooms(id) | Assigned room |
| `booking_date` | TEXT | NOT NULL | Format: YYYY-MM-DD |
| `booking_time` | TEXT | NOT NULL | Format: HH:MM (24-hr) |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Booking timestamp |

### Database Constraints & Indexes
1. `PRAGMA foreign_keys = ON;` is enforced on every connection.
2. `CREATE UNIQUE INDEX idx_bookings_room_datetime ON bookings(room_id, booking_date, booking_time);` prevents overlapping room bookings.
3. `CREATE INDEX idx_bookings_doctor_datetime ON bookings(doctor_id, booking_date, booking_time);` optimizes doctor conflict checks.
4. `CREATE INDEX idx_rooms_floor ON rooms(floor);` accelerates room floor search.
5. `CREATE INDEX idx_rooms_is_deleted ON rooms(is_deleted);` accelerates active room queries.
6. `CREATE INDEX idx_doctors_specialization ON doctors(specialization);` accelerates doctor specialization queries.

---

## 6. Table Relationships

```
+--------------------+              +-------------------------+
|      DOCTORS       |              |          ROOMS          |
+--------------------+              +-------------------------+
| id (PK)            | 1          1 | id (PK)                 |
| name               |----+    +----| name                    |
| specialization     |    |    |    | floor                   |
| created_at         |    |    |    | is_deleted              |
+--------------------+    |    |    | created_at              |
                          |    |    +-------------------------+
                          |    |
                          |    |
                   *      v    v      *
                  +----------------------+
                  |       BOOKINGS       |
                  +----------------------+
                  | id (PK)              |
                  | doctor_id (FK)       |
                  | room_id (FK)         |
                  | booking_date         |
                  | booking_time         |
                  | created_at           |
                  +----------------------+
```

- **One-to-Many:** One Doctor can have multiple Bookings.
- **One-to-Many:** One Room can host multiple Bookings.
- **Referential Integrity:** Deleting a Doctor or Room with active bookings is blocked by foreign key constraints.

---

## 7. Project Structure

```
clinic-health-centre/
├── config/
│   └── database.js               # SQLite connection singleton and PRAGMA configuration
├── controllers/
│   ├── doctorController.js       # Doctors business logic and search
│   ├── roomController.js         # Rooms logic, soft delete, restore, floor search
│   └── bookingController.js      # Bookings logic, conflict checks, and 3-table JOIN
├── database/
│   ├── initDb.js                 # Database schema initialization and index creation
│   ├── seedData.js               # Idempotent realistic sample data (5 docs, 5 rooms, 10 bookings)
│   ├── queries.js                # Modular parameterized SQL queries
│   └── verifyDb.js               # CLI database schema & record validation utility
├── middleware/
│   ├── errorHandler.js           # Centralized error handler and 404 router
│   └── validation.js             # Strict input validation for payloads, IDs, dates, times
├── routes/
│   ├── doctorRoutes.js           # /doctors route registration
│   ├── roomRoutes.js             # /rooms route registration
│   └── bookingRoutes.js          # /bookings route registration
├── tests/
│   ├── database.test.js          # DB schema, foreign keys, unique indexes, constraints
│   ├── api.test.js               # Full CRUD endpoints, search, and error tests
│   ├── server.test.js            # Server startup, /health, 404, file persistence
│   └── softDelete.test.js        # Compulsory 4-step soft delete & restore verification
├── .env.example                  # Template environment variables
├── .gitignore                    # Git ignore file (excludes node_modules, .env, *.db)
├── app.js                        # Express application configuration
├── server.js                     # HTTP server entrypoint and graceful shutdown
├── package.json                  # Dependencies and execution scripts
├── Clinic_Postman_Collection.json # Importable Postman v2.1.0 test suite
└── README.md                     # Comprehensive project documentation
```

---

## 8. Installation & Setup

### Prerequisites
- Node.js (version 18 or newer)
- npm (version 9 or newer)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/saisudheerchilukuri1-maker/clinic-health-centre.git
cd clinic-health-centre
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to create your `.env` file:
```bash
cp .env.example .env
```
Default configuration:
```env
NODE_ENV=development
PORT=5000
DB_FILE=database/clinic.db
```

### 4. Initialize and Seed the Database
```bash
# Create the 3 SQLite tables and indexes
npm run db:init

# Seed 5 doctors, 5 rooms, and 10 bookings (idempotent)
npm run db:seed
```

---

## 9. Server Startup

To start the server in production mode:
```bash
npm start
```

To start the server with auto-reload (development mode):
```bash
npm run dev
```

Output:
```
====================================================
🏥 CLINIC HEALTH CENTRE API SERVER RUNNING
📍 Port: 5000
🌐 Health check: http://localhost:5000/health
📋 Doctors API:  http://localhost:5000/doctors
🚪 Rooms API:    http://localhost:5000/rooms
📅 Bookings API: http://localhost:5000/bookings
🔗 JOIN details: http://localhost:5000/bookings/details
====================================================
```

---

## 10. API Documentation

### Health Check Endpoint
- **`GET /health`**
  - **Description:** Verifies server is operational.
  - **Response (200 OK):**
    ```json
    {
      "status": "OK",
      "service": "Clinic Health Centre API",
      "uptime": 12.34,
      "timestamp": "2026-11-15T10:30:00.000Z",
      "message": "Clinic Health Centre API is healthy and operational"
    }
    ```

---

### Doctors Endpoints (`/doctors`)
| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/doctors` | Get all doctors (supports `?specialization=...`) | 200 |
| `GET` | `/doctors/:id` | Get single doctor by ID | 200, 400, 404 |
| `POST` | `/doctors` | Create new doctor | 201, 400 |
| `PUT` | `/doctors/:id` | Update doctor details | 200, 400, 404 |
| `DELETE` | `/doctors/:id` | Delete doctor (blocked if bookings exist) | 200, 400, 404, 409 |

#### Example: POST /doctors
**Request Body:**
```json
{
  "name": "Dr. Gregory House",
  "specialization": "Diagnostic Medicine"
}
```
**Response (201 Created):**
```json
{
  "success": true,
  "message": "Doctor created successfully",
  "data": {
    "id": 6,
    "name": "Dr. Gregory House",
    "specialization": "Diagnostic Medicine"
  }
}
```

---

### Rooms Endpoints (`/rooms`)
| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/rooms` | Get all active rooms (supports `?floor=...`) | 200, 400 |
| `GET` | `/rooms/:id` | Get single active room by ID | 200, 400, 404 |
| `POST` | `/rooms` | Create new room | 201, 400 |
| `PUT` | `/rooms/:id` | Update active room | 200, 400, 404 |
| `DELETE` | `/rooms/:id` | Soft-delete room (`is_deleted = 1`) | 200, 400, 404 |
| `POST` | `/rooms/:id/restore` | Restore soft-deleted room (`is_deleted = 0`) | 200, 400, 404 |

---

### Bookings Endpoints (`/bookings`)
| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/bookings` | Get all bookings | 200 |
| `GET` | `/bookings/details` | **SQL JOIN:** Detailed bookings with doctor & room data | 200 |
| `GET` | `/bookings/:id` | Get single booking by ID | 200, 400, 404 |
| `POST` | `/bookings` | Create new booking (prevents conflicts) | 201, 400, 409 |
| `PUT` | `/bookings/:id` | Update booking | 200, 400, 404, 409 |
| `DELETE` | `/bookings/:id` | Delete booking | 200, 400, 404 |

#### Example: POST /bookings
**Request Body:**
```json
{
  "doctor_id": 2,
  "room_id": 3,
  "booking_date": "2026-11-28",
  "booking_time": "14:00"
}
```
**Response (201 Created):**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "id": 11,
    "doctor_id": 2,
    "room_id": 3,
    "booking_date": "2026-11-28",
    "booking_time": "14:00"
  }
}
```

---

## 11. SQL JOIN Endpoint (`GET /bookings/details`)

The `GET /bookings/details` endpoint joins all three tables (`bookings`, `doctors`, and `rooms`) to produce complete, human-readable appointment schedules:

```sql
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
ORDER BY b.booking_date ASC, b.booking_time ASC;
```

### Example Response (200 OK):
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "booking_id": 1,
      "booking_date": "2026-11-20",
      "booking_time": "09:00",
      "doctor_name": "Dr. Sarah Jenkins",
      "specialization": "Cardiology",
      "room_name": "Consultation Room A",
      "floor": 1
    },
    {
      "booking_id": 2,
      "booking_date": "2026-11-20",
      "booking_time": "09:30",
      "doctor_name": "Dr. Marcus Vance",
      "specialization": "Neurology",
      "room_name": "Consultation Room B",
      "floor": 1
    }
  ]
}
```

---

## 12. Soft Delete and Restore (Compulsory Assignment Requirement)

Rooms implement **safe archival via soft delete**:
- `DELETE /rooms/:id` sets `is_deleted = 1` and returns **200 OK**. The physical record remains preserved in the database.
- `GET /rooms` filters out deleted rooms (`WHERE is_deleted = 0`).
- `GET /rooms/:id` returns **404 Not Found** for deleted rooms.
- `POST /rooms/:id/restore` resets `is_deleted = 0` and returns **200 OK**.

### Mandatory 4-Step Test Cycle
1. **`DELETE /rooms/3`** → Returns **`200 OK`** (Room 3 marked as deleted).
2. **`GET /rooms/3`** → Returns **`404 Not Found`** (Deleted room is hidden).
3. **`POST /rooms/3/restore`** → Returns **`200 OK`** (Room 3 is reactivated).
4. **`GET /rooms/3`** → Returns **`200 OK`** (Room 3 is accessible again).

This exact cycle is automated in `tests/softDelete.test.js` and included as a dedicated folder in Postman.

---

## 13. Search Functionality

Parameterized SQL queries are used to ensure SQL injection protection:

### 1. Room Floor Search
- Request: `GET /rooms?floor=2`
- Returns only active rooms located on floor 2.
- Parameterized SQL:
  ```sql
  SELECT * FROM rooms WHERE is_deleted = 0 AND floor = ? ORDER BY id ASC;
  ```

### 2. Doctor Specialization Search
- Request: `GET /doctors?specialization=Cardiology`
- Case-insensitive search using parameterized query:
  ```sql
  SELECT * FROM doctors WHERE LOWER(specialization) LIKE LOWER(?) ORDER BY id ASC;
  ```

---

## 14. Validation & Conflict Prevention

Consistent JSON error responses and appropriate HTTP status codes:

| Scenario | HTTP Code | Response Reason |
|---|---|---|
| Missing required fields | `400 Bad Request` | Name, floor, doctor_id, room_id, date, or time is missing |
| Empty whitespace strings | `400 Bad Request` | String fields cannot be blank |
| Invalid data types | `400 Bad Request` | Floor or IDs must be positive integers |
| Invalid Date Format | `400 Bad Request` | Date must be valid calendar date in `YYYY-MM-DD` |
| Invalid Time Format | `400 Bad Request` | Time must be 24-hr `HH:MM` |
| Non-existent Doctor ID | `400 Bad Request` | Referenced doctor does not exist |
| Non-existent / Soft-Deleted Room | `400 Bad Request` | Referenced room does not exist or has been soft-deleted |
| Room Overlap Conflict | `409 Conflict` | Same room, date, and time already booked |
| Doctor Overlap Conflict | `409 Conflict` | Same doctor already booked at the exact same date & time |
| Resource Not Found | `404 Not Found` | Requested doctor, room, or booking ID does not exist |

---

## 15. Automated Testing

All tests use an isolated test database and do not mutate your main database.

Run the entire automated test suite:
```bash
npm test
```

### Test Coverage Overview (48 Tests across 4 Suites)
1. **`tests/database.test.js`** (8 tests):
   - Table count validation (exactly 3 tables).
   - Foreign key constraint enforcement.
   - Unique index conflict prevention.
   - Index verification.
   - Parameterized queries.
2. **`tests/api.test.js`** (32 tests):
   - All CRUD endpoints for Doctors, Rooms, and Bookings.
   - Doctor specialization search.
   - Room floor search.
   - 3-table SQL JOIN endpoint.
   - Validation failures (empty strings, bad dates, bad IDs).
   - 409 Conflict detection for room and doctor double-booking.
3. **`tests/server.test.js`** (3 tests):
   - Health check endpoint `/health`.
   - Unknown route 404 handling.
   - Physical database file persistence across connection reopens.
4. **`tests/softDelete.test.js`** (5 tests):
   - Mandatory 4-step soft delete and restore sequence.
   - Guard against booking soft-deleted rooms.
   - Guard against restoring non-existent rooms.

---

## 16. Postman Instructions

1. Open **Postman**.
2. Click **Import** in the upper left corner.
3. Select the file **`Clinic_Postman_Collection.json`** located in the root directory.
4. Confirm the `base_url` variable is set to `http://localhost:5000`.
5. Run any request or execute the entire collection runner!

---

## 17. 3-Minute Faculty Demonstration Guide

When presenting this project to your professor or faculty evaluator, follow this concise 3-minute script:

### Minute 1: Architecture & Automated Test Suite (0:00 - 1:00)
1. Open terminal and run:
   ```bash
   node database/verifyDb.js
   ```
   **Highlight:** Exactly 3 tables (`doctors`, `rooms`, `bookings`), 5 seeded doctors, 5 rooms, 10 bookings, and 5 performance indexes.
2. Run the automated test suite:
   ```bash
   npm test
   ```
   **Highlight:** Point out that all 48 tests pass with 100% success rate across database constraints, APIs, persistence, and soft delete.

### Minute 2: Start Server & Demonstrate Core Endpoints (1:00 - 2:00)
1. Start the server:
   ```bash
   npm start
   ```
2. Open Postman or your browser:
   - **Health Check:** `GET http://localhost:5000/health` (shows uptime & timestamp).
   - **Search:** `GET http://localhost:5000/rooms?floor=2` (demonstrates parameterized floor filter).
   - **SQL JOIN:** `GET http://localhost:5000/bookings/details` (demonstrates 3-table relational query joining doctors, rooms, and bookings with real database records).

### Minute 3: Soft Delete & Restore Demonstration (2:00 - 3:00)
Demonstrate the mandatory 4-step sequence:
1. `DELETE http://localhost:5000/rooms/3` → Returns `200 OK` (Room 3 is soft-deleted).
2. `GET http://localhost:5000/rooms/3` → Returns `404 Not Found` (Room 3 is hidden from active queries).
3. `POST http://localhost:5000/rooms/3/restore` → Returns `200 OK` (Room 3 restored).
4. `GET http://localhost:5000/rooms/3` → Returns `200 OK` (Room 3 is active again).

**Conclusion:** Conclude by highlighting zero double-booking conflict prevention (409 Conflict) and strict foreign key enforcement.

---

## 18. Author
- **Developer:** Sai Sudheer
- **Project:** Clinic Health Centre Backend
- **Repository:** [https://github.com/saisudheerchilukuri1-maker/clinic-health-centre](https://github.com/saisudheerchilukuri1-maker/clinic-health-centre)
- **License:** MIT
