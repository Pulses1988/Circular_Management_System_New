const circularApprovalModel = require("../models/circularApprovalsModel");

// Get all approvals
exports.getAllCircularApprovals = async (req, res) => {
  try {
    const [rows] = await circularApprovalModel.getAllCircularApprovals();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch circular approvals" });
  }
};

// Get all approvals with related data
exports.getAllCircularApprovalsWithRelations = async (req, res) => {
  try {
    const [rows] =
      await circularApprovalModel.getAllCircularApprovalsWithRelations();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Failed to fetch approvals with related data" });
  }
};

// Get by ID
exports.getCircularApprovalById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await circularApprovalModel.getCircularApprovalById(id);
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch approval" });
  }
};

// Create
exports.createCircularApproval = async (req, res) => {
  try {
    await circularApprovalModel.createCircularApproval(req.body);
    res.status(201).json({ message: "Circular approval created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create circular approval" });
  }
};

// Update
exports.updateCircularApproval = async (req, res) => {
  const { id } = req.params;
  try {
    await circularApprovalModel.updateCircularApproval(id, req.body);
    res.json({ message: "Circular approval updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update circular approval" });
  }
};

// Delete
exports.deleteCircularApproval = async (req, res) => {
  const { id } = req.params;
  try {
    await circularApprovalModel.deleteCircularApproval(id);
    res.json({ message: "Circular approval deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete circular approval" });
  }
};
