const db = require("../config/db");
const bcrypt = require("bcrypt");

// Get all employees with role, department, branch names
exports.getAllEmployees = () => {
  return db.query(`
    SELECT e.id, e.employee_id, e.first_name, e.middle_name, e.last_name,
           e.phone_no, e.email, e.permissions, e.created_at,
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
  permissions,
}) => {
  const password_hash = bcrypt.hashSync(password, 10);

  return db.query(
    `INSERT INTO employees 
      (employee_id, password_hash, first_name, middle_name, last_name, 
       phone_no, email, role_id, department_id, branch_id, permissions) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      JSON.stringify(permissions || {}),
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
    permissions,
  }
) => {
  return db.query(
    `UPDATE employees 
     SET first_name=?, middle_name=?, last_name=?, phone_no=?, email=?, 
         role_id=?, department_id=?, branch_id=?, permissions=? 
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
      JSON.stringify(permissions || {}),
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
