const db = require("../config/db");
const bcrypt = require("bcrypt");

// Get all employees with role, department, branch names
exports.getAllEmployees = () => {
  return db.query(`
    SELECT e.id, e.employee_id, e.first_name, e.middle_name, e.last_name,
           e.phone_no, e.email, e.can_create_circular,e.can_approve_circular, e.created_at,
           r.name AS role_name,
           d.name AS department_name,
           b.name AS branch_name
    FROM employees e
    LEFT JOIN roles r ON e.role_id = r.id
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN branches b ON e.branch_id = b.id
  `);
};

exports.getEmployeeById = (id) => {
  return db.query(
    `
    SELECT e.*, 
           r.name AS role_name,
           d.name AS department_name,
           b.name AS branch_name
    FROM employees e
    LEFT JOIN roles r ON e.role_id = r.id
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN branches b ON e.branch_id = b.id
    WHERE e.id = ?
  `,
    [id]
  );
};

exports.loginEmployee = (employee_id) => {
  return db.query(
    `
    SELECT e.id, e.employee_id, e.password_hash, e.first_name, e.middle_name, e.last_name,
           e.phone_no, e.email, e.role_id, e.department_id, e.branch_id, e.head_office_id,
           e.can_create_circular, e.can_approve_circular, e.created_at,
           r.name AS role_name,
           d.name AS department_name,
           b.name AS branch_name,
           b.address AS branch_address,
           ho.name AS head_office_name,
           ho.address AS head_office_address,
           ho.bank_name AS head_office_bank_name
    FROM employees e
    LEFT JOIN roles r ON e.role_id = r.id
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN branches b ON e.branch_id = b.id
    LEFT JOIN head_office ho ON e.head_office_id = ho.id
    WHERE e.employee_id = ?
    `,
    [employee_id]
  );
};

exports.createEmployee = ({
  employee_id,
  password,
  first_name,
  middle_name,
  last_name,
  phone_no,
  email,
  role_id,
  department_id,
  branch_id,
  head_office_id,
  can_create_circular,
  can_approve_circular,
}) => {
  const password_hash = bcrypt.hashSync(password, 10);

  return db.query(
    `INSERT INTO employees 
      (employee_id, password_hash, first_name, middle_name, last_name, 
       phone_no, email, role_id, department_id, branch_id,head_office_id, can_create_circular,can_approve_circular) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      employee_id,
      password_hash,
      first_name || null,
      middle_name || null,
      last_name || null,
      phone_no || null,
      email || null,
      role_id || null,
      department_id || null,
      branch_id || null,
      head_office_id || null,
      can_create_circular || null,
      can_approve_circular || null,
    ]
  );
};

exports.updateEmployee = (
  id,
  {
    first_name,
    middle_name,
    last_name,
    phone_no,
    email,
    role_id,
    department_id,
    branch_id,
    head_office_id,
    can_create_circular,
    can_approve_circular,
  }
) => {
  return db.query(
    `UPDATE employees 
     SET first_name=?, middle_name=?, last_name=?, phone_no=?, email=?, 
         role_id=?, department_id=?, branch_id=?, head_office_id=?, can_create_circular=?,can_approve_circular=?
     WHERE id=?`,
    [
      first_name || null,
      middle_name || null,
      last_name || null,
      phone_no || null,
      email || null,
      role_id || null,
      department_id || null,
      branch_id || null,
      head_office_id || null,
      can_create_circular || null,
      can_approve_circular || null,
      id,
    ]
  );
};

exports.deleteEmployee = (id) => {
  return db.query("DELETE FROM employees WHERE id = ?", [id]);
};

exports.findByEmployeeId = (employee_id) => {
  return db.query("SELECT id FROM employees WHERE employee_id = ?", [
    employee_id,
  ]);
};

exports.findByEmail = (email) => {
  return db.query("SELECT id FROM employees WHERE email = ?", [email]);
};

exports.findByPhone = (phone) => {
  return db.query("SELECT id FROM employees WHERE phone_no = ?", [phone]);
};

// Get employees for a specific Head Office, but branch_id is NULL
exports.getEmployeesByHeadOfficeWithoutBranch = (hoId) => {
  return db.query(
    `
    SELECT e.id, e.employee_id, e.first_name, e.middle_name, e.last_name,
           e.phone_no, e.email, e.head_office_id, e.can_create_circular, e.can_approve_circular, e.created_at,
           r.id AS role_id,
           r.name AS role_name,
           d.id AS department_id,
           d.name AS department_name,
           b.id AS branch_id,
           b.name AS branch_name
    FROM employees e
    LEFT JOIN roles r ON e.role_id = r.id
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN branches b ON e.branch_id = b.id
    WHERE e.head_office_id = ? AND e.branch_id IS NULL
    `,
    [hoId]
  );
};

// Get employees for a specific branch
exports.getEmployeesByBranch = (branchId) => {
  return db.query(
    `
    SELECT e.id, e.employee_id, e.first_name, e.middle_name, e.last_name,
           e.phone_no, e.email,e.role_id,e.department_id,e.branch_id, e.can_create_circular, e.can_approve_circular, e.created_at,
           r.name AS role_name,
           d.name AS department_name,
           b.name AS branch_name
    FROM employees e
    LEFT JOIN roles r ON e.role_id = r.id
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN branches b ON e.branch_id = b.id
    WHERE e.branch_id = ?
  `,
    [branchId]
  );
};

// Get employees who have approve authority
exports.getApprovers = () => {
  return db.query(`
    SELECT e.id, e.employee_id, e.first_name, e.middle_name, e.last_name,
           e.phone_no, e.email, e.can_create_circular, e.can_approve_circular, e.created_at,
           r.name AS role_name,
           d.name AS department_name,
           b.name AS branch_name,
           ho.name AS head_office_name
    FROM employees e
    LEFT JOIN roles r ON e.role_id = r.id
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN branches b ON e.branch_id = b.id
    LEFT JOIN head_office ho ON e.head_office_id = ho.id
    WHERE e.can_approve_circular = TRUE
    ORDER BY e.created_at DESC
  `);
};
