const { AppError } = require('./errorHandler');

/**
 * Validate that an ID parameter in the URL is a positive integer.
 */
function validateIdParam(req, res, next) {
  const { id } = req.params;
  const parsedId = Number(id);

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return next(new AppError('Invalid ID parameter. ID must be a positive integer.', 400));
  }

  req.parsedId = parsedId;
  next();
}

/**
 * Validate Doctor creation/update payload
 */
function validateDoctor(req, res, next) {
  const { name, specialization } = req.body;
  const errors = [];

  // Name validation
  if (name === undefined || name === null) {
    errors.push('Doctor name is required.');
  } else if (typeof name !== 'string') {
    errors.push('Doctor name must be a string.');
  } else if (name.trim().length === 0) {
    errors.push('Doctor name cannot be empty.');
  } else if (name.trim().length > 100) {
    errors.push('Doctor name cannot exceed 100 characters.');
  }

  // Specialization validation
  if (specialization === undefined || specialization === null) {
    errors.push('Doctor specialization is required.');
  } else if (typeof specialization !== 'string') {
    errors.push('Doctor specialization must be a string.');
  } else if (specialization.trim().length === 0) {
    errors.push('Doctor specialization cannot be empty.');
  } else if (specialization.trim().length > 100) {
    errors.push('Doctor specialization cannot exceed 100 characters.');
  }

  if (errors.length > 0) {
    return next(new AppError('Validation failed for doctor data.', 400, errors));
  }

  req.body.name = name.trim();
  req.body.specialization = specialization.trim();
  next();
}

/**
 * Validate Room creation/update payload
 */
function validateRoom(req, res, next) {
  const { name, floor } = req.body;
  const errors = [];

  // Name validation
  if (name === undefined || name === null) {
    errors.push('Room name is required.');
  } else if (typeof name !== 'string') {
    errors.push('Room name must be a string.');
  } else if (name.trim().length === 0) {
    errors.push('Room name cannot be empty.');
  } else if (name.trim().length > 100) {
    errors.push('Room name cannot exceed 100 characters.');
  }

  // Floor validation
  if (floor === undefined || floor === null) {
    errors.push('Room floor is required.');
  } else {
    const numFloor = Number(floor);
    if (!Number.isInteger(numFloor)) {
      errors.push('Room floor must be an integer.');
    } else if (numFloor < -5 || numFloor > 100) {
      errors.push('Room floor must be between -5 and 100.');
    }
  }

  if (errors.length > 0) {
    return next(new AppError('Validation failed for room data.', 400, errors));
  }

  req.body.name = name.trim();
  req.body.floor = Number(floor);
  next();
}

/**
 * Validate Date string in YYYY-MM-DD format and check if it is a real calendar date.
 */
function isValidDate(dateStr) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * Validate Time string in HH:MM (24-hour format).
 */
function isValidTime(timeStr) {
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return regex.test(timeStr);
}

/**
 * Validate Booking creation/update payload
 */
function validateBooking(req, res, next) {
  const { doctor_id, room_id, booking_date, booking_time } = req.body;
  const errors = [];

  // Doctor ID validation
  if (doctor_id === undefined || doctor_id === null) {
    errors.push('doctor_id is required.');
  } else {
    const dId = Number(doctor_id);
    if (!Number.isInteger(dId) || dId <= 0) {
      errors.push('doctor_id must be a positive integer.');
    }
  }

  // Room ID validation
  if (room_id === undefined || room_id === null) {
    errors.push('room_id is required.');
  } else {
    const rId = Number(room_id);
    if (!Number.isInteger(rId) || rId <= 0) {
      errors.push('room_id must be a positive integer.');
    }
  }

  // Booking Date validation
  if (booking_date === undefined || booking_date === null) {
    errors.push('booking_date is required.');
  } else if (typeof booking_date !== 'string') {
    errors.push('booking_date must be a string.');
  } else if (!isValidDate(booking_date.trim())) {
    errors.push('booking_date must be a valid date in YYYY-MM-DD format (e.g. 2026-11-20).');
  }

  // Booking Time validation
  if (booking_time === undefined || booking_time === null) {
    errors.push('booking_time is required.');
  } else if (typeof booking_time !== 'string') {
    errors.push('booking_time must be a string.');
  } else if (!isValidTime(booking_time.trim())) {
    errors.push('booking_time must be a valid 24-hour time in HH:MM format (e.g. 09:30 or 14:00).');
  }

  if (errors.length > 0) {
    return next(new AppError('Validation failed for booking data.', 400, errors));
  }

  req.body.doctor_id = Number(doctor_id);
  req.body.room_id = Number(room_id);
  req.body.booking_date = booking_date.trim();
  req.body.booking_time = booking_time.trim();
  next();
}

/**
 * Validate floor query parameter for search
 */
function validateFloorQuery(req, res, next) {
  if (req.query.floor !== undefined && req.query.floor !== '') {
    const floorNum = Number(req.query.floor);
    if (!Number.isInteger(floorNum)) {
      return next(new AppError('Floor query parameter must be an integer.', 400));
    }
  }
  next();
}

module.exports = {
  validateIdParam,
  validateDoctor,
  validateRoom,
  validateBooking,
  validateFloorQuery,
  isValidDate,
  isValidTime
};
