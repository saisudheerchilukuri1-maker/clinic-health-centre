require('dotenv').config();
const app = require('./app');
const { initDb } = require('./database/initDb');
const { closeDatabase } = require('./config/database');

const PORT = process.env.PORT || 5000;

// Ensure database tables and schema are initialized
try {
  initDb();
  console.log('✓ Clinic Health Centre database initialized.');
} catch (err) {
  console.error('✗ Failed to initialize database on startup:', err.message);
  process.exit(1);
}

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🏥 CLINIC HEALTH CENTRE API SERVER RUNNING`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 Doctors API:  http://localhost:${PORT}/doctors`);
  console.log(`🚪 Rooms API:    http://localhost:${PORT}/rooms`);
  console.log(`📅 Bookings API: http://localhost:${PORT}/bookings`);
  console.log(`🔗 JOIN details: http://localhost:${PORT}/bookings/details`);
  console.log(`====================================================`);
});

// Graceful shutdown handling
function gracefulShutdown(signal) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    closeDatabase();
    console.log('Database connection closed.');
    process.exit(0);
  });
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = server;
