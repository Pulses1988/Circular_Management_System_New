const db = require("../config/db");

exports.getAllBranches = () => {
  return db.query("SELECT * FROM branches");
};

exports.getAllBranchesWithHeadOffice = () => {
  return db.query(`
    SELECT b.id, b.name, b.address, b.head_office_id, h.name AS head_office_name, h.address AS head_office_address, b.created_at
    FROM branches b
    JOIN head_office h ON b.head_office_id = h.id
  `);
};

exports.getBranchById = (id) => {
  return db.query("SELECT * FROM branches WHERE id = ?", [id]);
};

exports.createBranch = ({ name, address, head_office_id }) => {
  return db.query(
    "INSERT INTO branches(name, address, head_office_id) VALUES (?, ?, ?)",
    [name, address || null, head_office_id]
  );
};

exports.deleteBranch = (id) => {
  return db.query("DELETE FROM branches WHERE id = ?", [id]);
};
