const headOfficeModel = require("../models/headOfficeModel");
const adminModel = require('../models/adminModel')

exports.getAllHeadOffice = async (req, res) => {
  try {
    const [rows] = await headOfficeModel.getAllHeadOffice();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch admins" });
  }
};
exports.getHeadOfficeById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await headOfficeModel.getHeadOfficeById(id);
    if (rows.length === 0)
      return res.status(404).json({ error: "Head office not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch Head Office" });
  }
};

exports.createHeadOffice = async (req, res) => {
  const { name, address, bank_name } = req.body;
  try {
    // 1. Create the head office and get its ID
    const [result] = await headOfficeModel.createHeadOffice({ name, address, bank_name });
    const headOfficeId = result.insertId;

    // 2. Assign this head office ID to the HO_ADMIN
    await adminModel.assignHeadOfficeToHoAdmin(headOfficeId);

    res.status(201).json({ message: "Head office created successfully", headOfficeId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create Head office" });
  }
};

exports.deleteHeadOffice = async (req, res) => {
  const { id } = req.params;
  try {
    await headOfficeModel.deleteOffice(id);
    res.json({ message: "Head office deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete head office" });
  }
};
