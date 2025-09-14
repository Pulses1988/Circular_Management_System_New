const branchModel = require("../models/branchesModel");

exports.getAllBranches = async (req, res) => {
  try {
    const [rows] = await branchModel.getAllBranches();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch branches" });
  }
};

exports.getAllBranchesWithHeadOffice = async (req, res) => {
  try {
    const [rows] = await branchModel.getAllBranchesWithHeadOffice();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Failed to fetch branches with head office info" });
  }
};

exports.getBranchById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await branchModel.getBranchById(id);
    if (rows.length === 0)
      return res.status(404).json({ error: "Branch not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch branch" });
  }
};

exports.createBranch = async (req, res) => {
  try {
    await branchModel.createBranch(req.body);
    res.status(201).json({ message: "Branch created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create branch" });
  }
};

exports.deleteBranch = async (req, res) => {
  const { id } = req.params;
  try {
    await branchModel.deleteBranch(id);
    res.json({ message: "Branch deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete branch" });
  }
};
