const mysql = require('mysql2');

// Create a connection pool (better than single connection for multiple queries)
const pool = mysql.createPool({
  host: 'localhost',      // or your server IP
  user: 'backend_user',  // the user you created
  password: 'Pulses@123', // the password you set
  database: 'circular_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Optional: wrap with promise support
const db = pool.promise();

module.exports = db;
