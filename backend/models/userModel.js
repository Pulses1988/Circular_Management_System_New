const db = require('../config/db');

async function fetchAllUsers() {
  const [rows] = await db.query('SELECT * FROM users');
  return rows;
}

module.exports = { fetchAllUsers };
