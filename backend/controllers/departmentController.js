const departmentModel = require("../models/departmentModel");

exports.getAllDepartments = async (req, res) => {
  try {
    const [rows] = await departmentModel.getAllDepartments();
    res.json(rows);
  } catch (err) {
    console.error("Error fetching departments:", err);
    res.status(500).json({ error: "Failed to fetch departments" });
  }
};

exports.getDepartmentsByHeadOffice = async (req, res) => {
  const { headOfficeId } = req.params;

  try {
    const [rows] = await departmentModel.getDepartmentsByHeadOffice(
      headOfficeId
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching head office departments:", err);
    res.status(500).json({ error: "Failed to fetch head office departments" });
  }
};

exports.getDepartmentsByBranch = async (req, res) => {
  const { branchId } = req.params;

  try {
    const [rows] = await departmentModel.getDepartmentsByBranch(branchId);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching branch departments:", err);
    res.status(500).json({ error: "Failed to fetch branch departments" });
  }
};

exports.createDepartment = async (req, res) => {
  const { name, head_office_id, branch_id } = req.body;

  // Validation
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: "Department name is required" });
  }

  // Check if either head_office_id or branch_id is provided (but not both)
  if ((!head_office_id && !branch_id) || (head_office_id && branch_id)) {
    return res.status(400).json({
      error:
        "Department must belong to either a head office or a branch, not both or neither",
    });
  }

  try {
    // Check if department name already exists
    const [existing] = await departmentModel.checkDepartmentNameExists(
      name.trim(),
      null,
      head_office_id,
      branch_id
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: "Department name already exists" });
    }

    const departmentData = {
      name: name.trim(),
      head_office_id: head_office_id || null,
      branch_id: branch_id || null,
    };

    const [result] = await departmentModel.createDepartment(departmentData);

    res.status(201).json({
      message: "Department created successfully",
      departmentId: result.insertId,
    });
  } catch (err) {
    console.error("Error creating department:", err);

    // Handle foreign key constraint errors
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        error: "Invalid head office or branch ID provided",
      });
    }

    res.status(500).json({ error: "Failed to create department" });
  }
};

exports.updateDepartment = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body; // Only accept 'name'

  // Validation
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: "Department name is required" });
  }

  try {
    // Check if department exists
    const [existing] = await departmentModel.getDepartmentById(id);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Department not found" });
    }

    // Check if department name already exists (excluding current department)
    const [nameExists] = await departmentModel.checkDepartmentNameExists(
      name.trim(),
      id,
      existing[0].head_office_id,
      existing[0].branch_id
    );
    if (nameExists.length > 0) {
      return res.status(400).json({ error: "Department name already exists" });
    }

    const departmentData = {
      name: name.trim(),
    };

    const [result] = await departmentModel.updateDepartment(id, departmentData);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Department not found" });
    }

    res.json({ message: "Department updated successfully" });
  } catch (err) {
    console.error("Error updating department:", err);
    res.status(500).json({ error: "Failed to update department" });
  }
};

// Delete department
exports.deleteDepartment = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if department exists
    const [existing] = await departmentModel.getDepartmentById(id);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Department not found" });
    }

    const [result] = await departmentModel.deleteDepartment(id);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Department not found" });
    }

    res.json({ message: "Department deleted successfully" });
  } catch (err) {
    console.error("Error deleting department:", err);

    // Handle foreign key constraint errors (if department is referenced elsewhere)
    if (err.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(400).json({
        error:
          "Cannot delete department. It is being referenced by other records.",
      });
    }

    res.status(500).json({ error: "Failed to delete department" });
  }
};

exports.getDepartmentCountByHeadOffice = async (req, res) => {
  const { headOfficeId } = req.params;
  try {
    const [result] = await departmentModel.getDepartmentCountByHeadOffice(
      headOfficeId
    );
    res.json(result[0]); // return { count: number }
  } catch (err) {
    console.error("Error fetching department count by head office:", err);
    res.status(500).json({ error: "Failed to fetch department count" });
  }
};

exports.getDepartmentCountByBranch = async (req, res) => {
  const { branchId } = req.params;
  try {
    const [result] = await departmentModel.getDepartmentCountByBranch(branchId);
    res.json(result[0]); // return { count: number }
  } catch (err) {
    console.error("Error fetching department count by branch:", err);
    res.status(500).json({ error: "Failed to fetch department count" });
  }
};
