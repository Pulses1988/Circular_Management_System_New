const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeesController");
const authenticateToken = require("../authMiddleware");

// Validation endpoints
router.get("/check-employee-id", authenticateToken, employeeController.checkEmployeeIdExists);
router.get("/check-email", authenticateToken, employeeController.checkEmailExists);

// CRUD endpoints
router.get("/", authenticateToken, employeeController.getAllEmployees);
router.get("/:id", authenticateToken, employeeController.getEmployeeById);
router.post("/", authenticateToken, employeeController.createEmployee);
router.put("/:id", authenticateToken, employeeController.updateEmployee);
router.delete("/:id", authenticateToken, employeeController.deleteEmployee);

module.exports = router;
