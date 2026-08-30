const db = require("../config/db");

// Insert a new role
const createRole = (roleData) => {
  return db.query(
    `INSERT INTO roles (name, position, head_office_id, branch_id, department_id) VALUES (?, ?, ?, ?, ?)`,
    [roleData.name, roleData.position, roleData.head_office_id, roleData.branch_id, roleData.department_id]
  );
};

//Get all roles by head office
const getRolesByHeadOffice = (headOfficeId) => {
  const query = `
    SELECT r.*, d.name as department_name, b.name as branch_name 
    FROM roles r
    LEFT JOIN departments d ON r.department_id = d.id
    LEFT JOIN branches b ON r.branch_id = b.id
    WHERE r.head_office_id = ?
    ORDER BY r.position ASC
  `;
  
  return db.execute(query, [headOfficeId]);
};

// Get all roles by branch
const getRolesByBranch = (branchId) => {
  const query = `
    SELECT r.*, d.name as department_name, b.name as branch_name 
    FROM roles r
    LEFT JOIN departments d ON r.department_id = d.id
    LEFT JOIN branches b ON r.branch_id = b.id
    WHERE r.branch_id = ?
    ORDER BY r.position ASC
  `;
  
  return db.execute(query, [branchId]);
};

// Get all roles by department
const getRolesByDepartment = (departmentId) => {
  const query = `
    SELECT r.*, d.name as department_name, b.name as branch_name 
    FROM roles r
    LEFT JOIN departments d ON r.department_id = d.id
    LEFT JOIN branches b ON r.branch_id = b.id
    WHERE r.department_id = ?
    ORDER BY r.position ASC
  `;
  
  return db.execute(query, [departmentId]);
};

// Get single role by ID
const getRoleById = async (roleId) => {
  const query = `
    SELECT r.*, d.name as department_name, b.name as branch_name 
    FROM roles r
    LEFT JOIN departments d ON r.department_id = d.id
    LEFT JOIN branches b ON r.branch_id = b.id
    WHERE r.id = ?
  `;
  
  const [rows] = await db.execute(query, [roleId]);
  return rows[0]; // Return first row directly
};

// Check if role with same name exists in the same context
const checkRoleExists = (name, headOfficeId, branchId, departmentId) => {
  let query = `
    SELECT id FROM roles 
    WHERE name = ? AND head_office_id = ?
  `;
  const params = [name, headOfficeId];

  if (branchId) {
    query += ` AND branch_id = ?`;
    params.push(branchId);
  } else {
    query += ` AND branch_id IS NULL`;
  }

  if (departmentId) {
    query += ` AND department_id = ?`;
    params.push(departmentId);
  } else {
    query += ` AND department_id IS NULL`;
  }
  
  return db.execute(query, params);
};

// Check if role with same name exists (excluding a specific role ID)
const checkRoleExistsExcludingId = (name, headOfficeId, branchId, departmentId, excludeRoleId) => {
  let query = `
    SELECT id FROM roles 
    WHERE name = ? AND head_office_id = ? AND id != ?
  `;
  const params = [name, headOfficeId, excludeRoleId];

  if (branchId) {
    query += ` AND branch_id = ?`;
    params.push(branchId);
  } else {
    query += ` AND branch_id IS NULL`;
  }

  if (departmentId) {
    query += ` AND department_id = ?`;
    params.push(departmentId);
  } else {
    query += ` AND department_id IS NULL`;
  }
  
  return db.execute(query, params);
};

// Check if position exists in the same context
const checkPositionExists = (position, headOfficeId, branchId, departmentId) => {
  let query = `
    SELECT id FROM roles 
    WHERE position = ? AND head_office_id = ?
  `;
  const params = [position, headOfficeId];

  if (branchId) {
    query += ` AND branch_id = ?`;
    params.push(branchId);
  } else {
    query += ` AND branch_id IS NULL`;
  }

  if (departmentId) {
    query += ` AND department_id = ?`;
    params.push(departmentId);
  } else {
    query += ` AND department_id IS NULL`;
  }
  
  return db.execute(query, params);
};

// Adjust positions when inserting a new role
const adjustPositionsOnInsert = async (newPosition, headOfficeId, branchId, departmentId) => {
  let query = `
    UPDATE roles 
    SET position = position + 1
    WHERE position >= ? AND head_office_id = ?
  `;
  const params = [newPosition, headOfficeId];

  if (branchId) {
    query += ` AND branch_id = ?`;
    params.push(branchId);
  } else {
    query += ` AND branch_id IS NULL`;
  }

  if (departmentId) {
    query += ` AND department_id = ?`;
    params.push(departmentId);
  } else {
    query += ` AND department_id IS NULL`;
  }
  
  return db.execute(query, params);
};

// Adjust positions when updating a role position
const adjustPositionsOnUpdate = async (roleId, oldPosition, newPosition, headOfficeId, branchId, departmentId) => {
  const baseCondition = `head_office_id = ?`;
  let conditionParams = [headOfficeId];

  if (branchId) {
    conditionParams.push(branchId);
  }
  if (departmentId) {
    conditionParams.push(departmentId);
  }

  let branchCondition = branchId ? `AND branch_id = ?` : `AND branch_id IS NULL`;
  let departmentCondition = departmentId ? `AND department_id = ?` : `AND department_id IS NULL`;

  if (newPosition > oldPosition) {
    // Moving down: decrease positions of roles between old and new position
    const query = `
      UPDATE roles 
      SET position = position - 1
      WHERE position > ? AND position <= ? AND ${baseCondition} ${branchCondition} ${departmentCondition} AND id != ?
    `;
    const params = [oldPosition, newPosition, ...conditionParams, roleId];
    await db.execute(query, params);
  } else if (newPosition < oldPosition) {
    // Moving up: increase positions of roles between new and old position
    const query = `
      UPDATE roles 
      SET position = position + 1
      WHERE position >= ? AND position < ? AND ${baseCondition} ${branchCondition} ${departmentCondition} AND id != ?
    `;
    const params = [newPosition, oldPosition, ...conditionParams, roleId];
    await db.execute(query, params);
  }
};

// Adjust positions when deleting a role
const adjustPositionsOnDelete = async (deletedPosition, headOfficeId, branchId, departmentId) => {
  let query = `
    UPDATE roles 
    SET position = position - 1
    WHERE position > ? AND head_office_id = ?
  `;
  const params = [deletedPosition, headOfficeId];

  if (branchId) {
    query += ` AND branch_id = ?`;
    params.push(branchId);
  } else {
    query += ` AND branch_id IS NULL`;
  }

  if (departmentId) {
    query += ` AND department_id = ?`;
    params.push(departmentId);
  } else {
    query += ` AND department_id IS NULL`;
  }
  
  return db.execute(query, params);
};

// Update role
const updateRole = (roleId, roleData) => {
  const { name, position } = roleData;
  const query = `
    UPDATE roles 
    SET name = ?, position = ?
    WHERE id = ?
  `;
  
  return db.execute(query, [name, position, roleId]);
};

// Update role position only
const updateRolePosition = (roleId, position) => {
  const query = `
    UPDATE roles 
    SET position = ?
    WHERE id = ?
  `;
  
  return db.execute(query, [position, roleId]);
};

// Delete role
const deleteRole = (roleId) => {
  const query = `DELETE FROM roles WHERE id = ?`;
  return db.execute(query, [roleId]);
};

// Get max position in context (for getting next position)
const getMaxPosition = (headOfficeId, branchId, departmentId) => {
  let query = `
    SELECT MAX(position) as max_position 
    FROM roles 
    WHERE head_office_id = ?
  `;
  const params = [headOfficeId];

  if (branchId) {
    query += ` AND branch_id = ?`;
    params.push(branchId);
  } else {
    query += ` AND branch_id IS NULL`;
  }

  if (departmentId) {
    query += ` AND department_id = ?`;
    params.push(departmentId);
  } else {
    query += ` AND department_id IS NULL`;
  }
  
  return db.execute(query, params);
}; 

// const getAllRoles = () => {
//   return db.execute(`
//     SELECT *
//     FROM roles
//     ORDER BY position ASC
//   `);
// }; 



const getAllRoles = () => {
  return db.execute(`
    SELECT
      r.id,
      r.name,
      r.position,
      r.head_office_id,
      r.branch_id,
      r.department_id,

      d.name AS department_name,
      b.name AS branch_name

    FROM roles r

    LEFT JOIN departments d
      ON r.department_id = d.id

    LEFT JOIN branches b
      ON r.branch_id = b.id

    ORDER BY r.position ASC
  `);
};




module.exports = {
  createRole,
  getRolesByHeadOffice,
  getRolesByBranch,
  getRolesByDepartment,
  getRoleById,
  checkRoleExists,
  checkRoleExistsExcludingId,
  checkPositionExists,
  adjustPositionsOnInsert,
  adjustPositionsOnUpdate,
  adjustPositionsOnDelete,
  updateRole,
  updateRolePosition,
  deleteRole,
  getMaxPosition,
  getAllRoles      // <-- ADD THIS

};

// Get employees for a specific role and branch 
// const getAllRoles = () => {
//   return db.execute(`
//     SELECT *
//     FROM roles
//     ORDER BY position ASC
//   `);
// }; 

