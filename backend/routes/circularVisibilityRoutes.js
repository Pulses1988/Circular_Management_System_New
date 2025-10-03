const express = require("express");
const router = express.Router();
const controller = require("../controllers/circularVisibilityController");

// Assign circular directly to employees
router.post("/assign-bulk", controller.assignBulk);

// Assign circular to employees by branch
router.post("/assign-branch", controller.assignByBranch);

// Assign circular to employees by department
router.post("/assign-department", controller.assignByDepartment);

// Assign circular to employees by head office
router.post("/assign-head-office", controller.assignByHeadOffice);

module.exports = router;
