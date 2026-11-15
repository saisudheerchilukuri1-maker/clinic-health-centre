const { bookingQueries, doctorQueries, roomQueries } = require('../database/queries');
const { AppError } = require('../middleware/errorHandler');

/**
 * Controller for Bookings & SQL JOIN
 */
const bookingController = {
  // GET /bookings
  getAllBookings: (req, res, next) => {
    try {
      const bookings = bookingQueries.findAll();
      res.status(200).json({
        success: true,
        count: bookings.length,
        data: bookings
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /bookings/details (SQL JOIN: bookings + doctors + rooms)
  getBookingDetails: (req, res, next) => {
    try {
      const details = bookingQueries.getBookingDetails();
      res.status(200).json({
        success: true,
        count: details.length,
        data: details
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /bookings/:id
  getBookingById: (req, res, next) => {
    try {
      const id = req.parsedId;
      const booking = bookingQueries.findById(null, id);
      if (!booking) {
        return next(new AppError(`Booking with ID ${id} not found`, 404));
      }
      res.status(200).json({
        success: true,
        data: booking
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /bookings
  createBooking: (req, res, next) => {
    try {
      const { doctor_id, room_id, booking_date, booking_time } = req.body;

      // 1. Verify doctor exists
      const doctor = doctorQueries.findById(null, doctor_id);
      if (!doctor) {
        return next(new AppError(`Doctor with ID ${doctor_id} does not exist.`, 400));
      }

      // 2. Verify room exists and is active (not soft-deleted)
      const room = roomQueries.findByIdActive(null, room_id);
      if (!room) {
        return next(new AppError(`Room with ID ${room_id} does not exist or has been deleted.`, 400));
      }

      // 3. Prevent duplicate/conflicting booking for the same room, date and time
      const roomConflict = bookingQueries.checkRoomConflict(null, room_id, booking_date, booking_time);
      if (roomConflict) {
        return next(
          new AppError(
            `Conflict: Room '${room.name}' (ID ${room_id}) is already booked on ${booking_date} at ${booking_time}.`,
            409
          )
        );
      }

      // 4. Prevent duplicate booking for the same doctor at the same date and time
      const doctorConflict = bookingQueries.checkDoctorConflict(null, doctor_id, booking_date, booking_time);
      if (doctorConflict) {
        return next(
          new AppError(
            `Conflict: Dr. ${doctor.name} (ID ${doctor_id}) already has another booking on ${booking_date} at ${booking_time}.`,
            409
          )
        );
      }

      // 5. Create booking
      const newBooking = bookingQueries.create(null, doctor_id, room_id, booking_date, booking_time);
      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        data: newBooking
      });
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return next(
          new AppError('Conflict: This room is already booked for the specified date and time.', 409)
        );
      }
      next(error);
    }
  },

  // PUT /bookings/:id
  updateBooking: (req, res, next) => {
    try {
      const id = req.parsedId;
      const { doctor_id, room_id, booking_date, booking_time } = req.body;

      // 1. Check if booking exists
      const existing = bookingQueries.findById(null, id);
      if (!existing) {
        return next(new AppError(`Booking with ID ${id} not found`, 404));
      }

      // 2. Verify doctor exists
      const doctor = doctorQueries.findById(null, doctor_id);
      if (!doctor) {
        return next(new AppError(`Doctor with ID ${doctor_id} does not exist.`, 400));
      }

      // 3. Verify room exists and is active
      const room = roomQueries.findByIdActive(null, room_id);
      if (!room) {
        return next(new AppError(`Room with ID ${room_id} does not exist or has been deleted.`, 400));
      }

      // 4. Check room conflict excluding current booking
      const roomConflict = bookingQueries.checkRoomConflict(null, room_id, booking_date, booking_time, id);
      if (roomConflict) {
        return next(
          new AppError(
            `Conflict: Room '${room.name}' (ID ${room_id}) is already booked on ${booking_date} at ${booking_time}.`,
            409
          )
        );
      }

      // 5. Check doctor conflict excluding current booking
      const doctorConflict = bookingQueries.checkDoctorConflict(null, doctor_id, booking_date, booking_time, id);
      if (doctorConflict) {
        return next(
          new AppError(
            `Conflict: Dr. ${doctor.name} (ID ${doctor_id}) already has another booking on ${booking_date} at ${booking_time}.`,
            409
          )
        );
      }

      // 6. Update booking
      const updated = bookingQueries.update(null, id, doctor_id, room_id, booking_date, booking_time);
      res.status(200).json({
        success: true,
        message: 'Booking updated successfully',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /bookings/:id
  deleteBooking: (req, res, next) => {
    try {
      const id = req.parsedId;
      const existing = bookingQueries.findById(null, id);
      if (!existing) {
        return next(new AppError(`Booking with ID ${id} not found`, 404));
      }

      const deleted = bookingQueries.delete(null, id);
      if (!deleted) {
        return next(new AppError(`Failed to delete booking with ID ${id}`, 500));
      }

      res.status(200).json({
        success: true,
        message: `Booking with ID ${id} deleted successfully`
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = bookingController;
