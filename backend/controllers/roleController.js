const roleModel = require("../models/roleModel");

// Create role
exports.createRole = async (req, res) => {
  const { name,position, head_office_id, branch_id, department_id } = req.body;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: "Role name is required" });
  }

  if (!head_office_id) {
    return res.status(400).json({ error: "Head Office ID is required" });
  }

  try {
    const roleData = {
      name: name.trim(),
      position,
      head_office_id,
      branch_id: branch_id || null,
      department_id: department_id || null
    };

    const [result] = await roleModel.createRole(roleData);
    res.status(201).json({
      message: "Role created successfully",
      roleId: result.insertId
    });
  } catch (err) {
    console.error("Error creating role:", err);
    res.status(500).json({ error: "Failed to create role" });
  }
};

exports.getRolesByHeadOffice = async (req, res) => {
  const { headOfficeId } = req.params;

  try {
    const roles = await roleModel.getRolesByHeadOffice(headOfficeId);
    res.json(roles);
  } catch (err) {
    console.error("Error fetching roles by head office:", err);
    res.status(500).json({ error: "Failed to fetch roles" });
  }
};

// Get roles by branch
exports.getRolesByBranch = async (req, res) => {
  const { branchId } = req.params;

  try {
    const roles = await roleModel.getRolesByBranch(branchId);
    res.json(roles);
  } catch (err) {
    console.error("Error fetching roles by branch:", err);
    res.status(500).json({ error: "Failed to fetch roles" });
  }
};

// Get roles by department
exports.getRolesByDepartment = async (req, res) => {
  const { departmentId } = req.params;

  try {
    const roles = await roleModel.getRolesByDepartment(departmentId);
    res.json(roles);
  } catch (err) {
    console.error("Error fetching roles by department:", err);
    res.status(500).json({ error: "Failed to fetch roles" });
  }
};

// Get single role by ID
exports.getRoleById = async (req, res) => {
  const { roleId } = req.params;

  try {
    const [role] = await roleModel.getRoleById(roleId);
    
    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }
    
    res.json(role);
  } catch (err) {
    console.error("Error fetching role:", err);
    res.status(500).json({ error: "Failed to fetch role" });
  }
};

// Update role
exports.updateRole = async (req, res) => {
  const { roleId } = req.params;
  const { name, position } = req.body;
  console.log('Update role request:', { roleId, name, position });

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: "Role name is required" });
  }

  try {
    // Get current role data
    const [currentRole] = await roleModel.getRoleById(roleId);
    
    if (!currentRole) {
      return res.status(404).json({ error: "Role not found" });
    }

    // Check if name already exists (excluding current role)
    const existingRole = await roleModel.checkRoleExistsExcludingId(
      name.trim(), 
      currentRole.head_office_id || null, 
      currentRole.branch_id || null, 
      currentRole.department_id || null,
      roleId
    );

    if (existingRole.length > 0) {
      return res.status(400).json({ error: "Role with this name already exists" });
    }

    // If position changed, adjust other positions
    if (position && position !== currentRole.position) {
      await roleModel.adjustPositionsOnUpdate(
        roleId,
        currentRole.position,
        position,
        currentRole.head_office_id || null,
        currentRole.branch_id || null,
        currentRole.department_id || null
      );
    }

    const updateData = {
      name: name.trim(),
      position: position || currentRole.position
    };

    await roleModel.updateRole(roleId, updateData);
    
    res.json({ message: "Role updated successfully" });
  } catch (err) {
    console.error("Error updating role:", err);
    res.status(500).json({ error: "Failed to update role" });
  }
};

// Update role position only
exports.updateRolePosition = async (req, res) => {
  const { roleId } = req.params;
  const { position } = req.body;

  if (!position || position < 1) {
    return res.status(400).json({ error: "Valid position is required" });
  }

  try {
    // Get current role data
    const [currentRole] = await roleModel.getRoleById(roleId);
    
    if (!currentRole) {
      return res.status(404).json({ error: "Role not found" });
    }

    // Adjust positions of other roles
    await roleModel.adjustPositionsOnUpdate(
      roleId,
      currentRole.position,
      position,
      currentRole.head_office_id || null,
      currentRole.branch_id || null,
      currentRole.department_id || null
    );

    await roleModel.updateRolePosition(roleId, position);
    
    res.json({ message: "Role position updated successfully" });
  } catch (err) {
    console.error("Error updating role position:", err);
    res.status(500).json({ error: "Failed to update role position" });
  }
};

// Delete role
exports.deleteRole = async (req, res) => {
  const { roleId } = req.params;

  try {
    // Get current role data
    const [currentRole] = await roleModel.getRoleById(roleId);
    
    if (!currentRole) {
      return res.status(404).json({ error: "Role not found" });
    }

    // Delete the role
    await roleModel.deleteRole(roleId);

    // Adjust positions of remaining roles
    await roleModel.adjustPositionsOnDelete(
      currentRole.position,
      currentRole.head_office_id || null,
      currentRole.branch_id || null,
      currentRole.department_id || null
    );
    
    res.json({ message: "Role deleted successfully" });
  } catch (err) {
    console.error("Error deleting role:", err);
    res.status(500).json({ error: "Failed to delete role" });
  }
};

// Bulk update role positions
exports.updateRolePositions = async (req, res) => {
  const { roleUpdates } = req.body;

  if (!Array.isArray(roleUpdates) || roleUpdates.length === 0) {
    return res.status(400).json({ error: "Role updates array is required" });
  }

  try {
    for (const update of roleUpdates) {
      if (!update.id || !update.position) {
        continue;
      }
      await roleModel.updateRolePosition(update.id, update.position);
    }
    
    res.json({ message: "Role positions updated successfully" });
  } catch (err) {
    console.error("Error updating role positions:", err);
    res.status(500).json({ error: "Failed to update role positions" });
  }
};
