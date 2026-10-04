const db = require("../config/db");

// exports.assignToEmployees = async (circularId, employeeIds) => {
//   if (!employeeIds || employeeIds.length === 0) return { affectedRows: 0 };

//   const values = employeeIds.map((id) => [circularId, id]);
//   const sql = `
//     INSERT INTO circular_visibility (circular_id, employee_id)
//     VALUES ?
//     ON DUPLICATE KEY UPDATE circular_id = circular_id
//   `;
//   return db.query(sql, [values]);
// };

exports.assignToEmployees = async (circularId, employeeIds) => {
  if (!employeeIds || employeeIds.length === 0) {
    return { affectedRows: 0 };
  }

  // Create placeholders for employee IDs
  const placeholders = employeeIds.map(() => "?").join(",");

  // Get employee information along with role,
  // branch and department names
  const employeeSql = `
    SELECT
      e.id AS employee_id,

      CONCAT_WS(
        ' ',
        e.first_name,
        e.middle_name,
        e.last_name
      ) AS employee_name,

      r.name AS employee_role,

      e.role_level,

      e.head_office_id,

      e.branch_id,
      b.name AS branch_name,

      e.department_id,
      d.name AS department_name

    FROM employees e

    LEFT JOIN roles r
      ON e.role_id = r.id

    LEFT JOIN branches b
      ON e.branch_id = b.id

    LEFT JOIN departments d
      ON e.department_id = d.id

    WHERE e.id IN (${placeholders})
  `;

  const [employees] = await db.query(employeeSql, employeeIds);

  if (!employees || employees.length === 0) {
    return { affectedRows: 0 };
  }

  // Prepare data for circular_visibility
  const values = employees.map((employee) => [
    circularId,
    employee.employee_id,
    employee.employee_name,
    employee.employee_role,
    employee.role_level,
    employee.head_office_id,
    employee.branch_id,
    employee.branch_name,
    employee.department_id,
    employee.department_name
  ]);

  // Insert employee information into circular_visibility
  const sql = `
    INSERT INTO circular_visibility (
      circular_id,
      employee_id,
      employee_name,
      employee_role,
      role_level,
      head_office_id,
      branch_id,
      branch_name,
      department_id,
      department_name
    )
    VALUES ?
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
      c.priority,
      c.effective_from,
      c.reference_circular_id,
      c.source_type_id,
      c.repeat_cycle_id, 

      CASE
  WHEN EXISTS (
    SELECT 1
    FROM circular_approvals ca
    WHERE ca.circular_id = c.id
  )
  THEN 'CIRCULAR'
  ELSE 'HO_ASSIGNMENT'
END AS item_type,

    

      ct.is_completed,
      ct.completed_at
    FROM circular_visibility cv
    INNER JOIN circulars c ON cv.circular_id = c.id
    LEFT JOIN employees e ON c.creator_employee_id = e.id
    LEFT JOIN circular_tracking ct ON c.id = ct.circular_id AND ct.employee_id = ?
    WHERE cv.employee_id = ? AND c.status IN ('APPROVED', 'COMPLETED')
    ORDER BY ct.is_completed ASC, c.created_at DESC
  `;
  const [rows] = await db.query(sql, [employeeId,employeeId]);
  return rows;
};

exports.getEmployeesByCircular = async (circular_id) => {
  const [rows] = await db.query(
    `SELECT DISTINCT employee_id FROM circular_visibility WHERE circular_id = ?`,
    [circular_id]
  );
  return rows;
};   


// Get employee IDs by role
exports.getEmployeesByRole = async (roleId) => {

    const sql = `
        SELECT id
        FROM employees
        WHERE role_id = ?
    `;

    const [rows] = await db.query(sql, [roleId]);

    return rows.map(row => row.id);

};