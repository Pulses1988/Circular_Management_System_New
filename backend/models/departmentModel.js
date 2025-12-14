const db = require("../config/db");

exports.getAllDepartments = () => {
  return db.query(`
    SELECT 
      d.id, 
      d.name, 
      d.head_office_id, 
      d.branch_id, 
      d.created_at,
      h.name AS head_office_name,
      h.address AS head_office_address,
      b.name AS branch_name,
      b.address AS branch_address
    FROM departments d
    LEFT JOIN head_office h ON d.head_office_id = h.id
    LEFT JOIN branches b ON d.branch_id = b.id
    ORDER BY d.created_at DESC
  `);
};

exports.getDepartmentsByHeadOffice = (headOfficeId) => {
  return db.query(
    `
    SELECT 
      d.id, 
      d.name,  
      d.head_office_id, 
      d.created_at,
      h.name AS head_office_name,
      h.address AS head_office_address
    FROM departments d
    LEFT JOIN head_office h ON d.head_office_id = h.id
    WHERE d.head_office_id = ?
    ORDER BY d.created_at DESC
  `,
    [headOfficeId]
  );
};

exports.getDepartmentsByBranch = (branchId) => {
  return db.query(
    `
    SELECT 
      d.id, 
      d.name,  
      d.branch_id, 
      d.created_at,
      b.name AS branch_name,
      b.address AS branch_address
    FROM departments d
    LEFT JOIN branches b ON d.branch_id = b.id
    WHERE d.branch_id = ?
    ORDER BY d.created_at DESC
  `,
    [branchId]
  );
};

exports.createDepartment = (departmentData) => {
  const { name, head_office_id, branch_id } = departmentData;

  return db.query(
    `INSERT INTO departments (name, head_office_id, branch_id) 
     VALUES (?, ?, ?)`,
    [name, head_office_id || null, branch_id || null]
  );
};

exports.updateDepartment = (id, departmentData) => {
  return db.query(`UPDATE departments SET name = ? WHERE id = ?`, [
    departmentData.name,
    id,
  ]);
};

exports.deleteDepartment = (id) => {
  return db.query("DELETE FROM departments WHERE id = ?", [id]);
};

exports.checkDepartmentNameExists = (
  name,
  excludeId = null,
  head_office_id = null,
  branch_id = null
) => {
  let query = `
    SELECT id FROM departments
    WHERE name = ?
      AND head_office_id <=> ?
      AND branch_id <=> ?
  `;

  const params = [name, head_office_id, branch_id];

  if (excludeId) {
    query += " AND id != ?";
    params.push(excludeId);
  }

  return db.query(query, params);
};

exports.getDepartmentCountByHeadOffice = (headOfficeId) => {
  return db.query(
    "SELECT COUNT(*) as count FROM departments WHERE head_office_id = ?",
    [headOfficeId]
  );
};

exports.getDepartmentCountByBranch = (branchId) => {
  return db.query(
    "SELECT COUNT(*) as count FROM departments WHERE branch_id = ?",
    [branchId]
  );
};
exports.getDepartmentById = (id) => {
  return db.query("SELECT * FROM departments WHERE id = ?", [id]);
};
