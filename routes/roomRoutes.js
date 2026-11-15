const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { validateIdParam, validateRoom, validateFloorQuery } = require('../middleware/validation');

// GET /rooms (with optional ?floor= query)
router.get('/', validateFloorQuery, roomController.getAllRooms);

// POST /rooms
router.post('/', validateRoom, roomController.createRoom);

// GET /rooms/:id
router.get('/:id', validateIdParam, roomController.getRoomById);

// PUT /rooms/:id
router.put('/:id', validateIdParam, validateRoom, roomController.updateRoom);

// DELETE /rooms/:id (Soft Delete)
router.delete('/:id', validateIdParam, roomController.deleteRoom);

// POST /rooms/:id/restore (Restore Soft-deleted Room)
router.post('/:id/restore', validateIdParam, roomController.restoreRoom);

module.exports = router;
