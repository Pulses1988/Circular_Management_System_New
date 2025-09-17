const db = require("../config/db");
const bcrypt = require("bcrypt");

exports.getAllAdmins = () => {
  return db.query("SELECT * FROM admin");
};

exports.getAllAdminsWithRelations = () => {
  return db.query(`
    SELECT 
      a.id, a.username, a.first_name, a.middle_name, a.last_name, a.email, a.admin_type, a.created_at,
      h.id AS head_office_id, h.name AS head_office_name, h.address AS head_office_address,
      b.id AS branch_id, b.name AS branch_name, b.address AS branch_address
    FROM admin a
    LEFT JOIN head_office h ON a.head_office_id = h.id
    LEFT JOIN branches b ON a.branch_id = b.id
  `);
};

exports.getAdminById = (id) => {
  return db.query("SELECT * FROM admin WHERE id = ?", [id]);
};

exports.getAdminByIdWithRelations = (id) => {
  return db.query(
    `
    SELECT 
      a.id, a.username, a.first_name, a.middle_name, a.last_name, a.email, a.admin_type, a.created_at,
      h.id AS head_office_id, h.name AS head_office_name, h.address AS head_office_address,
      b.id AS branch_id, b.name AS branch_name, b.address AS branch_address
    FROM admin a
    LEFT JOIN head_office h ON a.head_office_id = h.id
    LEFT JOIN branches b ON a.branch_id = b.id
    WHERE a.id = ?
  `,
    [id]
  );
};

exports.createAdmin = (adminData) => {
  const {
    username,
    password,
    first_name,
    middle_name,
    last_name,
    email,
    admin_type,
    head_office_id,
    branch_id,
  } = adminData;

  const password_hash = bcrypt.hashSync(password, 10);

  return db.query(
    `INSERT INTO admin 
      (username, password_hash, first_name, middle_name, last_name, email, admin_type, head_office_id, branch_id) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      username,
      password_hash,
      first_name || null,
      middle_name || null,
      last_name || null,
      email || null,
      admin_type,
      head_office_id || null,
      branch_id || null,
    ]
  );
};

exports.deleteAdmin = (id) => {
  return db.query("DELETE FROM admin WHERE id = ?", [id]);
};

exports.assignHeadOfficeToHoAdmin = (headOfficeId) => {
  return db.query(
    `UPDATE admin SET head_office_id = ? WHERE admin_type = 'HO_ADMIN'`,
    [headOfficeId]
  );
};