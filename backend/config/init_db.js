const db = require("./db");

const createAdminTableQuery = `
CREATE TABLE IF NOT EXISTS admin (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    middle_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255),
    admin_type ENUM('HO_ADMIN', 'BRANCH_ADMIN') NOT NULL,
    head_office_id INT NULL,
    branch_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (head_office_id) REFERENCES head_office(id) ON DELETE SET NULL,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);
`;

const createHeadOfficeTableQuery = `
CREATE TABLE IF NOT EXISTS head_office (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

const createBranchesTableQuery = `
CREATE TABLE IF NOT EXISTS branches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(255),
  head_office_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (head_office_id) REFERENCES head_office(id)
);
`;

async function initializeDatabase() {
  try {
    await db.query(createHeadOfficeTableQuery);
    console.log("Head Office table is ready");

    await db.query(createBranchesTableQuery);
    console.log("Branches table is ready");

    await db.query(createAdminTableQuery);
    console.log("Admin table is ready");
  } catch (err) {
    console.error("Error initializing database:", err);
  }
}

module.exports = initializeDatabase;
