const db = require("../config/db");

exports.getAllHeadOffice = () => {
  return db.query("SELECT * FROM head_office");
};

exports.getHeadOfficeById = (id) => {
  return db.query("SELECT * FROM head_office WHERE id = ?", [id]);
};
exports.createHeadOffice = (headOfficeData) => {
  const { name, address, bank_name } = headOfficeData;

  return db.query(`INSERT INTO head_office(name,address,bank_name) VALUES(?,?,?)`, [
    name,
    bank_name,
    address || null,
  ]);
};
exports.deleteOffice = (id) => {
  return db.query("DELETE FROM head_office WHERE id = ?", [id]);
};
