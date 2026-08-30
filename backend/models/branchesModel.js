const db = require("../config/db");

exports.getAllBranches = () => {
  return db.query("SELECT * FROM branches");
};

exports.getAllBranchesWithHeadOffice = () => {
  return db.query(`
       SELECT
      b.id,
      b.name,
      b.address,
      b.created_at,

      h.id AS head_office_id,
      h.name AS head_office_name,

      r.id AS region_id,
      r.name AS region_name,

      z.id AS zone_id,
      z.name AS zone_name,

      c.circle_id,
      c.circle_name

    FROM branches b

    LEFT JOIN head_office h
      ON b.head_office_id = h.id

    LEFT JOIN circle_table c
      ON b.circle_id = c.circle_id

    LEFT JOIN zones z
      ON c.zone_id = z.id

    LEFT JOIN regions r
      ON z.region_id = r.id

    ORDER BY b.id
 
  `);
};

exports.getBranchById = (id) => {
  return db.query("SELECT * FROM branches WHERE id = ?", [id]);
};

//to get a single Head_office 
exports.getSingleHeadOffice = () => {
  return db.query(`
    SELECT id
    FROM head_office
    ORDER BY id
    LIMIT 1
  `);
};









// exports.createBranch = ({ name, address, head_office_id }) => {
//   return db.query(
//     "INSERT INTO branches(name, address, head_office_id) VALUES (?, ?, ?)",
//     [name, address || null, head_office_id]
//   );
// };   

//Added new method 
exports.createBranch = ({
  name,
  address,
  head_office_id,
  circle_id,
}) => {
  return db.query(
    `INSERT INTO branches
    (name, address, head_office_id, circle_id)
    VALUES (?, ?, ?, ?)`,
    [
      name,
      address || null,
      head_office_id,
      circle_id || null,
    ]
  );
};




// exports.updateBranch = (id, { name, address, head_office_id }) => {
//   return db.query(
//     "UPDATE branches SET name = ?, address = ?, head_office_id = ? WHERE id = ?",
//     [name, address || null, head_office_id, id]
//   );
// }; 
exports.updateBranch = (
  id,
  {
    name,
    address,
    head_office_id,
    circle_id,
  }
) => {
  return db.query(
    `UPDATE branches
     SET
        name = ?,
        address = ?,
        head_office_id = ?,
        circle_id = ?
     WHERE id = ?`,
    [
      name,
      address || null,
      head_office_id,
      circle_id || null,
      id,
    ]
  );
};


exports.deleteBranch = (id) => {
  return db.query("DELETE FROM branches WHERE id = ?", [id]);
};

exports.findByUsername = (username) => {
  return db.query("SELECT id FROM admin WHERE username = ?", [username]);
};

exports.findByEmail = (email) => {
  return db.query("SELECT id FROM admin WHERE email = ?", [email]);
};

exports.getBranchesWithAdminStatus = () => {
  return db.query(`
    SELECT b.id, b.name,
           CASE 
              WHEN EXISTS (SELECT 1 FROM admin a WHERE a.branch_id = b.id) 
              THEN 1 ELSE 0 
           END AS has_admin
    FROM branches b
  `);
};

exports.getBranchCountByHeadOfficeId = (headOfficeId) => {
  return db.query(
    "SELECT COUNT(*) as count FROM branches WHERE head_office_id = ?",
    [headOfficeId]
  );
};

exports.checkBranchNameExists = (name, excludeId = null) => {
  if (excludeId) {
    return db.query("SELECT id FROM branches WHERE name = ? AND id != ?", [
      name,
      excludeId,
    ]);
  }
  return db.query("SELECT id FROM branches WHERE name = ?", [name]);
};


// Get all branches for a Head Office
exports.getBranchesByHeadOfficeId = (headOfficeId) => {
  return db.query(
    `
    SELECT
      id,
      name,
      address,
      head_office_id
    FROM branches
    WHERE head_office_id = ?
    ORDER BY name
    `,
    [headOfficeId]
  );
};