const db = require("../config/db");

exports.assignToEmployees = async (circularId, employeeIds) => {
  if (!employeeIds || employeeIds.length === 0) return { affectedRows: 0 };

  const values = employeeIds.map(id => [circularId, id]);
  const sql = `
    INSERT INTO circular_visibility (circular_id, employee_id)
    VALUES ?
    ON DUPLICATE KEY UPDATE circular_id = circular_id
  `;
  return db.query(sql, [values]);
};

// Get employee IDs by department
exports.getEmployeesByDepartment = async (departmentId) => {
  const sql = `SELECT id FROM employees WHERE department_id = ?`;
  const [rows] = await db.query(sql, [departmentId]);
  return rows.map(r => r.id);
};

// Get employee IDs by branch
exports.getEmployeesByBranch = async (branchId) => {
  const sql = `SELECT id FROM employees WHERE branch_id = ?`;
  const [rows] = await db.query(sql, [branchId]);
  return rows.map(r => r.id);
};

// Get employee IDs by head office
exports.getEmployeesByHeadOffice = async (headOfficeId) => {
  const sql = `SELECT id FROM employees WHERE head_office_id = ?`;
  const [rows] = await db.query(sql, [headOfficeId]);
  return rows.map(r => r.id);
};
