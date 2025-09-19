const express = require("express");
const router = express.Router();
const roleController = require("../controllers/roleController");
const authenticateToken = require("../authMiddleware");

// Route to create role
router.post("/", authenticateToken, roleController.createRole);

// Get roles by head office
router.get('/head-office/:headOfficeId',authenticateToken, roleController.getRolesByHeadOffice);

// Get roles by branch
router.get('/branch/:branchId',authenticateToken, roleController.getRolesByBranch);

// Get roles by department
router.get('/department/:departmentId',authenticateToken, roleController.getRolesByDepartment);

// Get single role by ID
router.get('/:roleId',authenticateToken, roleController.getRoleById);

// Update role
router.put('/:roleId',authenticateToken, roleController.updateRole);

// Update role position only
router.put('/:roleId/position',authenticateToken, roleController.updateRolePosition);

// Bulk update role positions
router.put('/bulk-position-update',authenticateToken, roleController.updateRolePositions);

// Delete role
router.delete('/:roleId',authenticateToken, roleController.deleteRole);

module.exports = router;
module.exports = router;
