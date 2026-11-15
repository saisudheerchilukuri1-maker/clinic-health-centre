const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { validateIdParam, validateDoctor } = require('../middleware/validation');

// GET /doctors (with optional ?specialization= query)
router.get('/', doctorController.getAllDoctors);

// GET /doctors/:id
router.get('/:id', validateIdParam, doctorController.getDoctorById);

// POST /doctors
router.post('/', validateDoctor, doctorController.createDoctor);

// PUT /doctors/:id
router.put('/:id', validateIdParam, validateDoctor, doctorController.updateDoctor);

// DELETE /doctors/:id
router.delete('/:id', validateIdParam, doctorController.deleteDoctor);

module.exports = router;
