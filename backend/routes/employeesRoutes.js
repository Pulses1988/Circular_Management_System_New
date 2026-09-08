const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeesController");
const authenticateToken = require("../authMiddleware");
// const authenticateToken = require("../middleware/authMiddleware");



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
  "/employee-by-region/:id",
  authenticateToken,
  employeeController.getEmployeesByRegion
);
router.get(
  "/employee-by-zone/:id",
  authenticateToken,
  employeeController.getEmployeesByZone
);
router.get(
  "/employee-by-circle/:id",
  authenticateToken,
  employeeController.getEmployeesByCircle
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
router.get(
    "/my-profile",
    authenticateToken,
    employeeController.getMyProfile
);

/* ===========================
   Forgot Password Routes
=========================== */

router.post(
    "/forgot-password",
    employeeController.sendForgotPasswordOtp
);

router.post(
    "/verify-otp",
    employeeController.verifyOtp
);

router.post(
    "/reset-password",
    employeeController.resetPassword
);

// ROUTE FOR HIGHER AUTORITY API
router.get(
    "/testHigherAuthority/:employeeId",
    employeeController.testHigherAuthority
);  

//Route to get employee count by head_office 
 
router.get(
  "/getByHeadOfficeEmployeeCount/:headOfficeId",
  authenticateToken,
  employeeController.HeadOfficeEmployeeCount
);



//Route to get employee by role 
router.get(
    "/employee-by-role/:id",
    authenticateToken,
    employeeController.getEmployeesByRole
);  


// Route to get employees by role level
router.get(
  "/employee-by-role-level/:roleLevel",
  authenticateToken,
  employeeController.getEmployeesByRoleLevel
);






//new route for reporting officer 
router.get(
  "/branch/:branchId/managers",
  employeeController.getBranchManagers
); 

//Route to get managers by head office 
router.get(
  "/head-office/:headOfficeId/managers",
  authenticateToken,
  employeeController.getHeadOfficeManagers
);



// CRUD endpoints
router.get("/", authenticateToken, employeeController.getAllEmployees);
router.post("/login", employeeController.loginEmployee);
router.get("/:id", authenticateToken, employeeController.getEmployeeById);
router.post("/", authenticateToken, employeeController.createEmployee);
router.put("/:id", authenticateToken, employeeController.updateEmployee);
router.delete("/:id", authenticateToken, employeeController.deleteEmployee);

module.exports = router;
