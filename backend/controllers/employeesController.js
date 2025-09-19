const employeeModel = require("../models/employeesModal");

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
