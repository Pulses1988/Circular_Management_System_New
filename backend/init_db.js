const db = require('./db');

async function initialize() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL
      )
    `);
    console.log('Table initialized');
  } catch (err) {
    console.error('Error initializing table:', err);
  } finally {
    process.exit();
  }
}

initialize();
