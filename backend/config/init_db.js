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
    bank_name VARCHAR(255) NOT NULL,
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
const createDepartmentQuery = `
  CREATE TABLE IF NOT EXISTS departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    head_office_id INT NULL,
    branch_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (head_office_id) REFERENCES head_office(id),
    FOREIGN KEY (branch_id) REFERENCES branches(id),
    CONSTRAINT check_one_nonnull CHECK (
        (head_office_id IS NOT NULL AND branch_id IS NULL) OR (head_office_id IS NULL AND branch_id IS NOT NULL)
    )
);`;

const createEmployeeTableQuery = `
CREATE TABLE IF NOT EXISTS employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    middle_name VARCHAR(255),
    last_name VARCHAR(255),
    phone_no VARCHAR(20),
    email VARCHAR(255),
    role_id INT NULL,
    department_id INT NULL,
    branch_id INT NULL,
    head_office_id INT NULL, 
    can_create_circular BOOLEAN,
    can_approve_circular BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
    FOREIGN KEY (head_office_id) REFERENCES head_office(id) ON DELETE SET NULL 
);
`;

const createRolesQuery = `
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    position INT NOT NULL,
    head_office_id INT NOT NULL,
    branch_id INT DEFAULT NULL,
    department_id INT DEFAULT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_roles_head_office FOREIGN KEY (head_office_id) REFERENCES head_office(id),
    CONSTRAINT fk_roles_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
    CONSTRAINT fk_roles_department FOREIGN KEY (department_id) REFERENCES departments(id)
);
`;

const createCircularQuery = `
CREATE TABLE IF NOT EXISTS circulars (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(512) ,
  content TEXT,
  creator_employee_id INT ,
  circular_pdf LONGBLOB ,
  reference_circular_id INT NULL,
  circular_code VARCHAR(100) ,             
  source_type_id INT ,                     
  effective_from TIMESTAMP ,                
  send_type ENUM('INTERNAL','CONFIDENTIAL','RESTRICTED','PUBLIC') ,
  status ENUM('DRAFT','PENDING_APPROVAL','REJECTED','APPROVED','PUBLISHED','ARCHIVED') ,
  repeat_cycle ENUM('ONE_TIME','WEEKLY','QUARTERLY','ANNUALLY')  ,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP NULL,

  FOREIGN KEY (creator_employee_id) REFERENCES employees(id),
  FOREIGN KEY (reference_circular_id) REFERENCES circulars(id) ON DELETE SET NULL,
  FOREIGN KEY (source_type_id) REFERENCES source_types(id)
);
`;

const createSourceTypeQuery = `CREATE TABLE IF NOT EXISTS source_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
);
`;

const createCircularApprovalsQuery = `CREATE TABLE IF NOT EXISTS circular_approvals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    circular_id INT NOT NULL,
    approver_id INT NOT NULL,
    has_seen BOOLEAN DEFAULT FALSE,
    seen_at TIMESTAMP NULL,
    status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
    comments TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (circular_id) REFERENCES circulars(id) ON DELETE CASCADE,
    FOREIGN KEY (approver_id) REFERENCES employees(id) ON DELETE CASCADE
);`;

async function initializeDatabase() {
  try {
    await db.query(createHeadOfficeTableQuery);
    console.log("Head Office table is ready");

    await db.query(createBranchesTableQuery);
    console.log("Branches table is ready");

    await db.query(createDepartmentQuery);
    console.log("Departments table is ready");

    await db.query(createRolesQuery);
    console.log("Roles table is ready");

    await db.query(createAdminTableQuery);
    console.log("Admin table is ready");

    await db.query(createEmployeeTableQuery);
    console.log("Employee table is ready");

    await db.query(createSourceTypeQuery);
    console.log("Source type is ready");

    await db.query(createCircularQuery);
    console.log("Circular table is ready");

    await db.query(createCircularApprovalsQuery);
    console.log("Circular Approvals table is ready");
  } catch (err) {
    console.error("Error initializing database:", err);
  }
}

module.exports = initializeDatabase;
