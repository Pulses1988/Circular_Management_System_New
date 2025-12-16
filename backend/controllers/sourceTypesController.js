const sourceTypeModel = require("../models/sourceTypesModel");

exports.getAllSourceTypes = async (req, res) => {
  try {
    const [rows] = await sourceTypeModel.getAllSourceTypes();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch source types" });
  }
};

exports.getSourceTypeById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await sourceTypeModel.getSourceTypeById(id);
    if (!rows.length)
      return res.status(404).json({ error: "Source type not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch source type" });
  }
};

exports.createSourceType = async (req, res) => {
  const { name } = req.body;
  try {
    const [existing] = await sourceTypeModel.findByName(name);
    if (existing.length)
      return res.status(400).json({ error: "Source type already exists" });

    const [result] = await sourceTypeModel.createSourceType({ name });
    const [newSource] = await sourceTypeModel.getSourceTypeById(
      result.insertId
    );
    res.status(201).json(newSource[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create source type" });
  }
};

exports.updateSourceType = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    const [existing] = await sourceTypeModel.findByName(name);
    if (existing.length) {
      return res.status(400).json({ error: "Source type already exists" });
    }
    await sourceTypeModel.updateSourceType(id, { name });
    res.json({ message: "Source type updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update source type" });
  }
};

exports.deleteSourceType = async (req, res) => {
  const { id } = req.params;
  try {
    await sourceTypeModel.deleteSourceType(id);
    res.json({ message: "Source type deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete source type" });
  }
};