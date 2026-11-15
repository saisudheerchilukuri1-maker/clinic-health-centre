const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { validateIdParam, validateBooking } = require('../middleware/validation');

// GET /bookings/details - SQL JOIN of doctors, rooms, and bookings
// MUST precede /:id to prevent route clash
router.get('/details', bookingController.getBookingDetails);

// GET /bookings
router.get('/', bookingController.getAllBookings);

// GET /bookings/:id
router.get('/:id', validateIdParam, bookingController.getBookingById);

// POST /bookings
router.post('/', validateBooking, bookingController.createBooking);

// PUT /bookings/:id
router.put('/:id', validateIdParam, validateBooking, bookingController.updateBooking);

// DELETE /bookings/:id
router.delete('/:id', validateIdParam, bookingController.deleteBooking);

module.exports = router;
