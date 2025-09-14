const adminModel = require("../models/adminModel");

exports.getAllAdmins = async (req, res) => {
  try {
    const [rows] = await adminModel.getAllAdmins();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch admins" });
  }
};

exports.getAdminsWithRelations = async (req, res) => {
  try {
    const [rows] = await adminModel.getAllAdminsWithRelations();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch admins with related data" });
  }
};

// exports.getAdminById = async (req, res) => {
//   const { id } = req.params;
//   try {
//     const [rows] = await adminModel.getAdminById(id);
//     if (rows.length === 0)
//       return res.status(404).json({ error: "Admin not found" });
//     res.json(rows[0]);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to fetch admin" });
//   }
// };

exports.getAdminById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await adminModel.getAdminByIdWithRelations(id);
    if (rows.length === 0)
      return res.status(404).json({ error: "Admin not found" });

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch admin data" });
  }
};

exports.createAdmin = async (req, res) => {
  const adminData = req.body;
  try {
    await adminModel.createAdmin(adminData);
    res.status(201).json({ message: "Admin created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create admin" });
  }
};

exports.deleteAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    await adminModel.deleteAdmin(id);
    res.json({ message: "Admin deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete admin" });
  }
};
