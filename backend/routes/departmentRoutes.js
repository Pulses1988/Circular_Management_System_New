const express = require("express");
const router = express.Router();
const departmentController = require("../controllers/departmentController");
const authenticateToken = require("../authMiddleware")

router.get("/head-office/:headOfficeId",authenticateToken, departmentController.getDepartmentsByHeadOffice);
router.get("/branch/:branchId",authenticateToken, departmentController.getDepartmentsByBranch);
router.post("/",authenticateToken, departmentController.createDepartment);
router.put("/:id",authenticateToken, departmentController.updateDepartment);
router.delete("/:id",authenticateToken, departmentController.deleteDepartment);
router.get("/head-office/:headOfficeId/count", authenticateToken, departmentController.getDepartmentCountByHeadOffice);
router.get("/branch/:branchId/count", authenticateToken, departmentController.getDepartmentCountByBranch);
module.exports = router;