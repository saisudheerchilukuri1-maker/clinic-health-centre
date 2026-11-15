const { doctorQueries } = require('../database/queries');
const { AppError } = require('../middleware/errorHandler');

/**
 * Controller for Doctors
 */
const doctorController = {
  // GET /doctors (supports ?specialization=...)
  getAllDoctors: (req, res, next) => {
    try {
      const { specialization } = req.query;
      const doctors = doctorQueries.findAll(null, specialization);
      res.status(200).json({
        success: true,
        count: doctors.length,
        data: doctors
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /doctors/:id
  getDoctorById: (req, res, next) => {
    try {
      const id = req.parsedId;
      const doctor = doctorQueries.findById(null, id);
      if (!doctor) {
        return next(new AppError(`Doctor with ID ${id} not found`, 404));
      }
      res.status(200).json({
        success: true,
        data: doctor
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /doctors
  createDoctor: (req, res, next) => {
    try {
      const { name, specialization } = req.body;
      const newDoctor = doctorQueries.create(null, name, specialization);
      res.status(201).json({
        success: true,
        message: 'Doctor created successfully',
        data: newDoctor
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /doctors/:id
  updateDoctor: (req, res, next) => {
    try {
      const id = req.parsedId;
      const { name, specialization } = req.body;

      // Check existence
      const existing = doctorQueries.findById(null, id);
      if (!existing) {
        return next(new AppError(`Doctor with ID ${id} not found`, 404));
      }

      const updated = doctorQueries.update(null, id, name, specialization);
      res.status(200).json({
        success: true,
        message: 'Doctor updated successfully',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /doctors/:id
  deleteDoctor: (req, res, next) => {
    try {
      const id = req.parsedId;
      const existing = doctorQueries.findById(null, id);
      if (!existing) {
        return next(new AppError(`Doctor with ID ${id} not found`, 404));
      }

      // Check if doctor has bookings assigned
      const { getDatabase } = require('../config/database');
      const db = getDatabase();
      const bookingCheck = db.prepare('SELECT COUNT(*) as count FROM bookings WHERE doctor_id = ?').get(id);
      if (bookingCheck && bookingCheck.count > 0) {
        return next(
          new AppError(`Cannot delete doctor with ID ${id} because active bookings are assigned to this doctor.`, 409)
        );
      }

      const deleted = doctorQueries.delete(null, id);
      if (!deleted) {
        return next(new AppError(`Failed to delete doctor with ID ${id}`, 500));
      }

      res.status(200).json({
        success: true,
        message: `Doctor with ID ${id} deleted successfully`
      });
    } catch (error) {
      // Handle foreign key constraint if doctor has bookings
      if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' || (error.message && error.message.includes('FOREIGN KEY'))) {
        return next(new AppError(`Cannot delete doctor with ID ${req.parsedId} because active bookings are assigned to this doctor.`, 409));
      }
      next(error);
    }
  }
};

module.exports = doctorController;
