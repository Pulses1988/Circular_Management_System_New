const db = require("../config/db");

exports.assignToEmployees = async (circularId, employeeIds) => {
  if (!employeeIds || employeeIds.length === 0) return { affectedRows: 0 };

  const values = employeeIds.map((id) => [circularId, id]);
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
  return rows.map((r) => r.id);
};

// Get employee IDs by branch
exports.getEmployeesByBranch = async (branchId) => {
  const sql = `SELECT id FROM employees WHERE branch_id = ?`;
  const [rows] = await db.query(sql, [branchId]);
  return rows.map((r) => r.id);
};

// Get employee IDs by head office
exports.getEmployeesByHeadOffice = async (headOfficeId) => {
  const sql = `SELECT id FROM employees WHERE head_office_id = ?`;
  const [rows] = await db.query(sql, [headOfficeId]);
  return rows.map((r) => r.id);
};

exports.getEmployeesByCircularId = (circular_id) => {
  return db.query("SELECT * FROM circular_visibility WHERE circular_id = ?", [
    circular_id,
  ]);
};

exports.removeEmployeesFromCircular = async (circularId, employeeIds) => {
  if (!Array.isArray(employeeIds) || employeeIds.length === 0) return;
  const placeholders = employeeIds.map(() => "?").join(",");
  const sql = `DELETE FROM circular_visibility WHERE circular_id = ? AND employee_id IN (${placeholders})`;
  return db.query(sql, [circularId, ...employeeIds]);
};

exports.removeAllEmployeesFromCircular = async (circularId) => {
  const sql = `DELETE FROM circular_visibility WHERE circular_id = ?`;
  return db.query(sql, [circularId]);
};

//get all assinged circular for Emp by Id
exports.getCircularsByEmployee = async (employeeId) => {
  const sql = `
    SELECT 
      c.id,
      c.title,
      c.content,
      c.circular_code,
      c.send_type,
      c.status,
      c.created_at,
      c.published_at,
      c.effective_from,
      c.reference_circular_id,
      c.source_type_id,
      c.repeat_cycle_id
    FROM circular_visibility cv
    INNER JOIN circulars c ON cv.circular_id = c.id
    LEFT JOIN employees e ON c.creator_employee_id = e.id
     WHERE cv.employee_id = ? AND c.status = 'APPROVED'
    ORDER BY c.created_at DESC
  `;
  const [rows] = await db.query(sql, [employeeId]);
  return rows;
};
