const adminModel = require("../models/adminModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const JWT_SECRET = process.env.JWT_SECRET || 'f47da57fdab5d8fdbe2b7855db15c11304197f2941d340cd302bbcddee0f04117f4ae1a5fbdb1e0a64f8f727587e3442bf9b44be6811f7f9c383f4860380b7f7';
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

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await adminModel.getAllAdmins();
    const admin = rows.find(a => a.username === username);

    if (!admin) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin.id, username: admin.username, admin_type: admin.admin_type },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful!",
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        admin_type: admin.admin_type,
        head_office_id:admin.head_office_id,
        branch_id:admin.branch_id
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
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
