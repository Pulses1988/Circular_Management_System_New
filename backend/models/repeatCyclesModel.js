const db = require("../config/db");

// Get all repeat cycles
exports.getAllRepeatCycles = () => {
  return db.query("SELECT * FROM repeat_cycles ORDER BY id");
};

// Get repeat cycle by ID
exports.getRepeatCycleById = (id) => {
  return db.query("SELECT * FROM repeat_cycles WHERE id = ?", [id]);
};

// Create new repeat cycle
exports.createRepeatCycle = (data) => {
  const { name, duration_days } = data;
  return db.query(
    "INSERT INTO repeat_cycles (name, duration_days) VALUES (?, ?)",
    [name, duration_days || null]
  );
};

// Update repeat cycle
exports.updateRepeatCycle = (id, data) => {
  const { name, duration_days } = data;
  return db.query(
    "UPDATE repeat_cycles SET name = ?, duration_days = ? WHERE id = ?",
    [name, duration_days || null, id]
  );
};

// Delete repeat cycle
exports.deleteRepeatCycle = (id) => {
  return db.query("DELETE FROM repeat_cycles WHERE id = ?", [id]);
};
