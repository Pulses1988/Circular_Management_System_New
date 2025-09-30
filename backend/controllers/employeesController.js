const employeeModel = require("../models/employeesModal");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "f47da57fdab5d8fdbe2b7855db15c11304197f2941d340cd302bbcddee0f04117f4ae1a5fbdb1e0a64f8f727587e3442bf9b44be6811f7f9c383f4860380b7f7";

// Get all employees
exports.getAllEmployees = async (req, res) => {
  try {
    const [rows] = await employeeModel.getAllEmployees();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
};

exports.loginEmployee = async (req, res) => {
  try {
    const { employee_id, password } = req.body;

    // Validation
    if (!employee_id || !password) {
      return res.status(400).json({
        success: false,
        message: "Employee ID and password are required",
      });
    }

    // Get employee data
    const [rows] = await employeeModel.loginEmployee(employee_id);

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid employee ID or password",
      });
    }

    const employee = rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(
      password,
      employee.password_hash
    );
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid employee ID or password",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        employeeId: employee.id,
        employee_id: employee.employee_id,
        role_id: employee.role_id,
        department_id: employee.department_id,
        branch_id: employee.branch_id,
        head_office_id: employee.head_office_id,
        head_office_name: employee.head_office_name,
        can_create_circular: employee.can_create_circular,
        can_approve_circular: employee.can_approve_circular,
        bank_name: employee.bank_name,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Remove password_hash from response
    delete employee.password_hash;

    // Success response
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token: token,
        employee: employee,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get employee by ID
exports.getEmployeeById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await employeeModel.getEmployeeById(id);
    if (rows.length === 0)
      return res.status(404).json({ error: "Employee not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch employee" });
  }
};

// Get employees for specific Head Office with branch_id NULL
exports.getEmployeesByHeadOfficeWithoutBranch = async (req, res) => {
  const { id: hoId } = req.params;
  try {
    const [rows] = await employeeModel.getEmployeesByHeadOfficeWithoutBranch(
      hoId
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
};

// Get employees for specific branch
exports.getEmployeesByBranch = async (req, res) => {
  const { id: branchId } = req.params;
  try {
    const [rows] = await employeeModel.getEmployeesByBranch(branchId);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
};

// Create new employee
exports.createEmployee = async (req, res) => {
  try {
    const [result] = await employeeModel.createEmployee(req.body);
    const newId = result.insertId;
    const [rows] = await employeeModel.getEmployeeById(newId);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create employee" });
  }
};

// Update employee
exports.updateEmployee = async (req, res) => {
  const { id } = req.params;
  try {
    await employeeModel.updateEmployee(id, req.body);
    res.json({ message: "Employee updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update employee" });
  }
};

// Delete employee
exports.deleteEmployee = async (req, res) => {
  const { id } = req.params;
  try {
    await employeeModel.deleteEmployee(id);
    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete employee" });
  }
};

// Check if employee_id exists
exports.checkEmployeeIdExists = async (req, res) => {
  const { employee_id } = req.query;
  try {
    const [rows] = await employeeModel.findByEmployeeId(employee_id);
    res.json(rows.length > 0);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to check employee_id" });
  }
};

// Check if email exists
exports.checkEmailExists = async (req, res) => {
  const { email } = req.query;
  try {
    const [rows] = await employeeModel.findByEmail(email);
    res.json(rows.length > 0);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to check email" });
  }
};

exports.checkPhoneNoExists = async (req, res) => {
  const { phone } = req.query;
  try {
    const [rows] = await employeeModel.findByPhone(phone);
    res.json(rows.length > 0);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to check phone number" });
  }
};

// Get employees with approve authority
exports.getApprovers = async (req, res) => {
  try {
    const [rows] = await employeeModel.getApprovers();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch approvers" });
  }
};
