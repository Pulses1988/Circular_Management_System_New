const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeesController");
const authenticateToken = require("../authMiddleware");

// Validation endpoints
router.get(
  "/check-employee-id",
  authenticateToken,
  employeeController.checkEmployeeIdExists
);
router.get(
  "/check-email",
  authenticateToken,
  employeeController.checkEmailExists
);
router.get(
  "/employee-by-headoffice/:id",
  authenticateToken,
  employeeController.getEmployeesByHeadOfficeWithoutBranch
);
router.get(
  "/employee-by-branch/:id",
  authenticateToken,
  employeeController.getEmployeesByBranch
);
router.get(
  "/check-phone",
  authenticateToken,
  employeeController.checkPhoneNoExists
);

// Other endpoints
router.get("/approvers", authenticateToken, employeeController.getApprovers);

// get data based on the branch id and deprtment id
router.get(
  "/getByDeptAndBranch",
  authenticateToken,
  employeeController.filterEmployees
);

router.get(
  "/department/:departmentId",
  authenticateToken,
  employeeController.getEmployeesByDepartment
);

router.get(
  "/getAllEmployeeCount",
  authenticateToken,
  employeeController.AllEmployeeCount
);

router.get(
  "/getByBranchEmployeeCount/:branchId",
  authenticateToken,
  employeeController.BranchEmployeeCount
);

// CRUD endpoints
router.get("/", authenticateToken, employeeController.getAllEmployees);
router.post("/login", employeeController.loginEmployee);
router.get("/:id", authenticateToken, employeeController.getEmployeeById);
router.post("/", authenticateToken, employeeController.createEmployee);
router.put("/:id", authenticateToken, employeeController.updateEmployee);
router.delete("/:id", authenticateToken, employeeController.deleteEmployee);

module.exports = router;
