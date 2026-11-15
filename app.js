require('dotenv').config();
const express = require('express');
const doctorRoutes = require('./routes/doctorRoutes');
const roomRoutes = require('./routes/roomRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'Clinic Health Centre API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    message: 'Clinic Health Centre API is healthy and operational'
  });
});

// Central Route Registration
app.use('/doctors', doctorRoutes);
app.use('/rooms', roomRoutes);
app.use('/bookings', bookingRoutes);

// 404 Handler for undefined endpoints
app.use(notFoundHandler);

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
