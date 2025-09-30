const repeatCycleModel = require("../models/repeatCyclesModel");

// Get all repeat cycles
exports.getAllRepeatCycles = async (req, res) => {
  try {
    const [rows] = await repeatCycleModel.getAllRepeatCycles();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch repeat cycles" });
  }
};

// Get repeat cycle by ID
exports.getRepeatCycleById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await repeatCycleModel.getRepeatCycleById(id);
    if (rows.length === 0)
      return res.status(404).json({ error: "Repeat cycle not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch repeat cycle" });
  }
};

// Create repeat cycle
exports.createRepeatCycle = async (req, res) => {
  const data = req.body;
  try {
    await repeatCycleModel.createRepeatCycle(data);
    res.status(201).json({ message: "Repeat cycle created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create repeat cycle" });
  }
};

// Update repeat cycle
exports.updateRepeatCycle = async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  try {
    await repeatCycleModel.updateRepeatCycle(id, data);
    res.json({ message: "Repeat cycle updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update repeat cycle" });
  }
};

// Delete repeat cycle
exports.deleteRepeatCycle = async (req, res) => {
  const { id } = req.params;
  try {
    await repeatCycleModel.deleteRepeatCycle(id);
    res.json({ message: "Repeat cycle deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete repeat cycle" });
  }
};
