const CircularVisibility = require("../models/circularVisibilityModel");

exports.assignBulk = async (req, res) => {
  try {
    const { circularId, employeeIds } = req.body;

    if (!circularId || !employeeIds || employeeIds.length === 0) {
      return res.status(400).json({ error: "circularId and employeeIds required" });
    }

    const result = await CircularVisibility.assignToEmployees(circularId, employeeIds);

    return res.json({
      message: "Circular assigned successfully",
      assigned: employeeIds.length,
      dbResult: result
    });
  } catch (err) {
    console.error("assignBulk Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Assign to department
exports.assignByDepartment = async (req, res) => {
  try {
    const { circularId, departmentId } = req.body;

    if (!circularId || !departmentId) {
      return res.status(400).json({ error: "circularId and departmentId required" });
    }

    const employeeIds = await CircularVisibility.getEmployeesByDepartment(departmentId);

    if (!employeeIds || employeeIds.length === 0) {
      return res.json({ message: "No employees found in this department", assigned: 0 });
    }

    const result = await CircularVisibility.assignToEmployees(circularId, employeeIds);

    return res.json({
      message: "Circular assigned to all employees in department",
      assigned: employeeIds.length,
      dbResult: result
    });
  } catch (err) {
    console.error("assignByDepartment Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Assign to branch
exports.assignByBranch = async (req, res) => {
  try {
    const { circularId, branchId } = req.body;

    if (!circularId || !branchId) {
      return res.status(400).json({ error: "circularId and branchId required" });
    }

    const employeeIds = await CircularVisibility.getEmployeesByBranch(branchId);

    if (!employeeIds || employeeIds.length === 0) {
      return res.json({ message: "No employees found in this branch", assigned: 0 });
    }

    const result = await CircularVisibility.assignToEmployees(circularId, employeeIds);

    return res.json({
      message: "Circular assigned to all employees in branch",
      assigned: employeeIds.length,
      dbResult: result
    });
  } catch (err) {
    console.error("assignByBranch Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Assign to head office
exports.assignByHeadOffice = async (req, res) => {
  try {
    const { circularId, headOfficeId } = req.body;

    if (!circularId || !headOfficeId) {
      return res.status(400).json({ error: "circularId and headOfficeId required" });
    }

    const employeeIds = await CircularVisibility.getEmployeesByHeadOffice(headOfficeId);

    if (!employeeIds || employeeIds.length === 0) {
      return res.json({ message: "No employees found in this head office", assigned: 0 });
    }

    const result = await CircularVisibility.assignToEmployees(circularId, employeeIds);

    return res.json({
      message: "Circular assigned to all employees in head office",
      assigned: employeeIds.length,
      dbResult: result
    });
  } catch (err) {
    console.error("assignByHeadOffice Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getCircularsByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!employeeId) {
      return res.status(400).json({ error: "employeeId is required" });
    }

    const circulars = await CircularVisibility.getCircularsByEmployee(employeeId);

    if (!circulars || circulars.length === 0) {
      return res.json({ message: "No circulars found for this employee", data: [] });
    }

    return res.json({
      message: "Circulars fetched successfully",
      count: circulars.length,
      data: circulars
    });
  } catch (err) {
    console.error("getCircularsByEmployee Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};