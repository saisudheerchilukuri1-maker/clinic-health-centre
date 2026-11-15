const { roomQueries } = require('../database/queries');
const { AppError } = require('../middleware/errorHandler');

/**
 * Controller for Rooms (with Soft Delete, Restore & Search)
 */
const roomController = {
  // GET /rooms (supports ?floor=...)
  getAllRooms: (req, res, next) => {
    try {
      const { floor } = req.query;
      const rooms = roomQueries.findAllActive(null, floor);
      res.status(200).json({
        success: true,
        count: rooms.length,
        data: rooms
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /rooms/:id (Returns 404 for deleted or non-existent rooms)
  getRoomById: (req, res, next) => {
    try {
      const id = req.parsedId;
      const room = roomQueries.findByIdActive(null, id);
      if (!room) {
        return next(new AppError(`Room with ID ${id} not found`, 404));
      }
      res.status(200).json({
        success: true,
        data: room
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /rooms
  createRoom: (req, res, next) => {
    try {
      const { name, floor } = req.body;
      const newRoom = roomQueries.create(null, name, floor);
      res.status(201).json({
        success: true,
        message: 'Room created successfully',
        data: newRoom
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /rooms/:id
  updateRoom: (req, res, next) => {
    try {
      const id = req.parsedId;
      const { name, floor } = req.body;

      // Check if room exists and is active
      const existing = roomQueries.findByIdActive(null, id);
      if (!existing) {
        return next(new AppError(`Room with ID ${id} not found or has been deleted`, 404));
      }

      const updated = roomQueries.update(null, id, name, floor);
      res.status(200).json({
        success: true,
        message: 'Room updated successfully',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /rooms/:id (Soft Delete)
  deleteRoom: (req, res, next) => {
    try {
      const id = req.parsedId;

      // Check if room exists and is currently active
      const activeRoom = roomQueries.findByIdActive(null, id);
      if (!activeRoom) {
        return next(new AppError(`Room with ID ${id} not found or is already deleted`, 404));
      }

      roomQueries.softDelete(null, id);

      res.status(200).json({
        success: true,
        message: `Room with ID ${id} soft-deleted successfully`,
        data: { id, is_deleted: 1 }
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /rooms/:id/restore (Restore soft-deleted room)
  restoreRoom: (req, res, next) => {
    try {
      const id = req.parsedId;

      // Check if room exists in DB at all
      const room = roomQueries.findByIdAny(null, id);
      if (!room) {
        return next(new AppError(`Room with ID ${id} not found`, 404));
      }

      if (room.is_deleted === 0) {
        return res.status(200).json({
          success: true,
          message: `Room with ID ${id} is already active`,
          data: room
        });
      }

      roomQueries.restore(null, id);
      const restoredRoom = roomQueries.findByIdActive(null, id);

      res.status(200).json({
        success: true,
        message: `Room with ID ${id} restored successfully`,
        data: restoredRoom
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = roomController;
