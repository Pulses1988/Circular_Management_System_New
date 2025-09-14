const db = require("../config/db");


exports.getAllAdmins = () => {
  return db.query("SELECT * FROM admin");
};

exports.getAdminById = (id) => {
  return db.query("SELECT * FROM admin WHERE id = ?", [id]);
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

  //   const password_hash = bcrypt.hashSync(password, 10);

  return db.query(
    `INSERT INTO admin 
      (username, password_hash, first_name, middle_name, last_name, email, admin_type, head_office_id, branch_id) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      username,
      password,
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
