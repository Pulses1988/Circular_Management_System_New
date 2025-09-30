const db = require("../config/db");

exports.getAllSourceTypes = () => {
  return db.query("SELECT * FROM source_types ORDER BY id");
};

exports.getSourceTypeById = (id) => {
  return db.query("SELECT * FROM source_types WHERE id = ?", [id]);
};

exports.createSourceType = ({ name }) => {
  return db.query("INSERT INTO source_types(name) VALUES (?)", [name]);
};

exports.updateSourceType = (id, { name }) => {
  return db.query("UPDATE source_types SET name = ? WHERE id = ?", [name, id]);
};

exports.deleteSourceType = (id) => {
  return db.query("DELETE FROM source_types WHERE id = ?", [id]);
};
exports.findByName = (name) => {
  return db.query("SELECT id FROM source_types WHERE name = ?", [name]);
};
