const mysql = require('mysql2');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Create a connection pool using environment variables
const pool = mysql.createPool({
  host: process.env.DB_HOST,      // from .env
  user: process.env.DB_USER,      // from .env
  password: process.env.DB_PASSWORD, // from .env
  database: process.env.DB_NAME,  // from .env
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Optional: wrap with promise support
const db = pool.promise();

module.exports = db;
