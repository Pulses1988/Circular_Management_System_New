const db = require("./db");

const createAdminTableQuery = `CREATE TABLE IF NOT EXISTS admin( id INT PRIMARY KEY AUTO_INCREMENT,username VARCHAR(255) NOT NULL UNIQUE,password_hash VARCHAR(255) NOT NULL,first_name VARCHAR(255),middle_name VARCHAR(255),last_name VARCHAR(255),email VARCHAR(255),admin_type ENUM('HO_ADMIN', 'BRANCH_ADMIN') NOT NULL, head_office_id INT NULL,
    branch_id INT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;

async function initializeDatabase() {
  try {
    await db.query(createAdminTableQuery);
    console.log("Admin table is ready");
  } catch (err) {
    console.error("Error initializing database:", err);
  }
}

module.exports = initializeDatabase;
