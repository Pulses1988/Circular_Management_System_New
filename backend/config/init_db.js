const { createRecurrenceLog } = require("../models/circularRecurrenceModel");
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

const createRepeatCycleTableQuery = `
CREATE TABLE IF NOT EXISTS repeat_cycles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE,
  duration_days INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

const insertDefaultRepeatCycleQuery = `
INSERT INTO repeat_cycles (name, duration_days)
SELECT 'Once', 0
WHERE NOT EXISTS (
    SELECT 1 FROM repeat_cycles WHERE name = 'Once'
);
`;
const createCircularVisibilityQuery = `
CREATE TABLE IF NOT EXISTS circular_visibility (
    id INT AUTO_INCREMENT PRIMARY KEY,
    circular_id INT NOT NULL,
    employee_id INT NOT NULL,

    CONSTRAINT fk_circular FOREIGN KEY (circular_id) REFERENCES circulars(id) ON DELETE CASCADE,
    CONSTRAINT fk_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,

    UNIQUE (circular_id, employee_id),

    INDEX idx_employee (employee_id),
    INDEX idx_circular (circular_id)
);
`;

const createCircularQuery = `
CREATE TABLE IF NOT EXISTS circulars (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(512),
  content TEXT,
  creator_employee_id INT,
  circular_pdf LONGBLOB,
  reference_circular_id INT NULL,
  circular_code VARCHAR(100),
  source_type_id INT,
  effective_from TIMESTAMP,
  send_type ENUM('INTERNAL','CONFIDENTIAL','RESTRICTED','PUBLIC','CUSTOM'),
  status ENUM('DRAFT','PENDING_APPROVAL','REJECTED','APPROVED','PUBLISHED','COMPLETED'),
  repeat_cycle_id INT,
  is_recurring BOOLEAN DEFAULT FALSE,
  last_recurrence_date DATE NULL,
  next_recurrence_date DATE NULL,
  current_cycle_number INT DEFAULT 1,
  priority ENUM('LOW','MEDIUM','HIGH','URGENT') DEFAULT 'MEDIUM',
  special_keyword VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP NULL,

  FOREIGN KEY (creator_employee_id) REFERENCES employees(id),
  FOREIGN KEY (reference_circular_id) REFERENCES circulars(id) ON DELETE SET NULL,
  FOREIGN KEY (source_type_id) REFERENCES source_types(id),
  FOREIGN KEY (repeat_cycle_id) REFERENCES repeat_cycles(id)
);
`;

const createCircularTracking = `
CREATE TABLE IF NOT EXISTS circular_tracking (
    track_id INT AUTO_INCREMENT PRIMARY KEY,
    circular_id INT NOT NULL,
    employee_id INT NOT NULL,
    is_seen BOOLEAN DEFAULT FALSE,
    seen_at TIMESTAMP NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    
    CONSTRAINT fk_ct_circular FOREIGN KEY (circular_id) REFERENCES circulars(id) ON DELETE CASCADE,
    CONSTRAINT fk_ct_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,

    UNIQUE (circular_id, employee_id),
    INDEX idx_employee (employee_id),
    INDEX idx_circular (circular_id)
);
`;

const createCircularChats=`
CREATE TABLE IF NOT EXISTS circular_chats (
chat_id INT AUTO_INCREMENT PRIMARY KEY,
  circular_id INT NOT NULL,
  employee_id INT NOT NULL,
  message TEXT NOT NULL,
  is_system_message BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (circular_id) REFERENCES circulars(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);
`;

const createCircularAttachments=`
CREATE TABLE IF NOT EXISTS circular_attachments (
  attachment_id INT AUTO_INCREMENT PRIMARY KEY,
  circular_id INT NOT NULL,
  employee_id INT NOT NULL,
  chat_id INT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INT NOT NULL,
  file_data LONGBLOB NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (circular_id) REFERENCES circulars(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (chat_id) REFERENCES circular_chats(chat_id) ON DELETE CASCADE,
  INDEX idx_circular (circular_id),
  INDEX idx_employee (employee_id),
  INDEX idx_chat (chat_id)
);
`;
const createCircularNotifications=`
CREATE TABLE IF NOT EXISTS circular_notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  circular_id INT NOT NULL,
  recipient_employee_id INT NOT NULL,
  sender_employee_id INT NOT NULL,
  notification_type ENUM('message', 'attachment') NOT NULL,
  message_preview VARCHAR(255),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (circular_id) REFERENCES circulars(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  INDEX idx_recipient (recipient_employee_id, is_read),
  INDEX idx_circular (circular_id)
);`;

const createCircularComplition = `
CREATE TABLE IF NOT EXISTS circular_completions (
  completion_id INT AUTO_INCREMENT PRIMARY KEY,
  circular_id INT NOT NULL,
  cycle_start_date DATE NULL,
  cycle_end_date DATE NULL,
  cycle_number INT NOT NULL DEFAULT 1,
  completed_by_employee_id INT NOT NULL,
  reference_number VARCHAR(100) NOT NULL,
  submission_mode ENUM('BY_HAND', 'BY_COURIER', 'BY_RPD') NOT NULL,
  completion_notes TEXT,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (circular_id) REFERENCES circulars(id) ON DELETE CASCADE,
  FOREIGN KEY (completed_by_employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  INDEX idx_circular (circular_id),
  INDEX idx_employee (completed_by_employee_id)
);`;

const circularRecurrenceLog = `
CREATE TABLE IF NOT EXISTS circular_recurrence_log (
  recurrence_id INT AUTO_INCREMENT PRIMARY KEY,
  circular_id INT NOT NULL,
  cycle_number INT NOT NULL,
  cycle_start_date DATE NOT NULL,
  cycle_end_date DATE NOT NULL,
  status ENUM('ACTIVE', 'COMPLETED', 'EXPIRED') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (circular_id) REFERENCES circulars(id) ON DELETE CASCADE,
  UNIQUE KEY unique_cycle (circular_id, cycle_number),
  INDEX idx_status (status),
  INDEX idx_dates (cycle_start_date, cycle_end_date)
);
`;

// Rule-engine tables existed only in deployed databases. Keep the bootstrap
// schema in sync and make the reminder additions safe for existing installs.
const createRuleMasterQuery = `
CREATE TABLE IF NOT EXISTS rule_master (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rule_name VARCHAR(200), event_name VARCHAR(100), action_name VARCHAR(100),
  status ENUM('ACTIVE','INACTIVE') DEFAULT 'ACTIVE', created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  condition_field VARCHAR(100), condition_operator VARCHAR(20), condition_value VARCHAR(255),
  reminder_frequency_value INT NULL, reminder_frequency_unit VARCHAR(20) NULL,
  notify_creator BOOLEAN DEFAULT FALSE
);`;
const createRuleTargetsQuery = `
CREATE TABLE IF NOT EXISTS rule_targets (
  id INT AUTO_INCREMENT PRIMARY KEY, rule_id INT, target_type VARCHAR(100), target_id INT NULL,
  FOREIGN KEY (rule_id) REFERENCES rule_master(id) ON DELETE CASCADE
);`;
const createRuleExecutionHistoryQuery = `
CREATE TABLE IF NOT EXISTS rule_execution_history (
  id INT AUTO_INCREMENT PRIMARY KEY, rule_id INT NULL, event_name VARCHAR(100) NOT NULL,
  rule_name VARCHAR(100) NOT NULL, action_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'SUCCESS', entity_id INT NULL,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

async function addColumnIfMissing(table, column, definition) {
  const [rows] = await db.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  if (!rows.length) await db.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
}

async function ensureRuleEngineSchema() {
  await db.query(createRuleMasterQuery);
  await db.query(createRuleTargetsQuery);
  await db.query(createRuleExecutionHistoryQuery);
  await addColumnIfMissing('rule_master', 'reminder_frequency_value', 'INT NULL');
  await addColumnIfMissing('rule_master', 'reminder_frequency_unit', 'VARCHAR(20) NULL');
  await addColumnIfMissing('rule_master', 'notify_creator', 'BOOLEAN DEFAULT FALSE');
  await addColumnIfMissing('rule_execution_history', 'rule_id', 'INT NULL');
  await addColumnIfMissing('circular_tracking', 'last_reminder_at', 'TIMESTAMP NULL');
  // The old enum cannot represent the admin reminder target; avoid a table
  // alteration on every application start once it has been migrated.
  const [targetColumn] = await db.query(
    `SELECT COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rule_targets' AND COLUMN_NAME = 'target_type'`
  );
  if (targetColumn[0] && targetColumn[0].COLUMN_TYPE.startsWith('enum(')) {
    await db.query('ALTER TABLE rule_targets MODIFY COLUMN target_type VARCHAR(100) NULL');
  }
}

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

    await db.query(createRepeatCycleTableQuery);
    console.log("Repeat Cycles table is ready");

    await db.query(insertDefaultRepeatCycleQuery);
    console.log("Default 'Once' repeat cycle added");

    await db.query(createCircularQuery);
    console.log("Circular table is ready");

    await db.query(createCircularApprovalsQuery);
    console.log("Circular Approvals table is ready");
    await db.query(createCircularVisibilityQuery);
    console.log("Circular Visibility table is ready");

    await db.query(createCircularTracking);
    console.log("Circular Tracking table is ready");

    await db.query(createCircularChats);
    console.log("Circular Chats table is ready");

    await db.query(createCircularAttachments);
    console.log('Circular Attachment table is ready')

     await db.query(createCircularNotifications);
    console.log('Circular Notification table is ready')

    await db.query(createCircularComplition);
    console.log('Circular Complition table is ready')

    await db.query(circularRecurrenceLog);
    console.log('Reccurnce table is ready')

    await ensureRuleEngineSchema();
    console.log('Rule Engine tables are ready');
    
  } catch (err) {
    console.error("Error initializing database:", err);
  }
}

module.exports = initializeDatabase;
