const express = require("express");
const router = express.Router();

const committeeController = require("../controllers/committeeController");

const uploadExcel = require("../uploadExcel");
/**
 * ===========================
 * Committee CRUD APIs
 * ===========================
 */

// Create Committee
router.post("/create", committeeController.createCommittee);

// Get All Committees
router.get("/", committeeController.getAllCommittees);

// Get Committee By ID
router.get("/:id", committeeController.getCommitteeById);

// Get employees eligible for assignment to a committee
router.get(
  "/:id/eligible-employees",
  committeeController.getEligibleCommitteeEmployees
);

// Update Committee
router.put("/:id", committeeController.updateCommittee);

// Delete Committee
router.delete("/:id", committeeController.deleteCommittee);

/**
 * ===========================
 * Committee Member APIs
 * ===========================
 */

// Add Employee to Committee
router.post("/member", committeeController.addCommitteeMember);

//Add route for uploading exel file 
router.post(
  "/member/upload-excel",
  uploadExcel.single("excelFile"),
  committeeController.uploadCommitteeMembersExcel
);

// Get Members of a Committee
router.get("/:id/members", committeeController.getCommitteeMembers);

// Remove Committee Member
router.delete("/member/:id", committeeController.removeCommitteeMember);

// Get Committees of an Employee
router.get("/employee/:employee_id", committeeController.getEmployeeCommittees);

module.exports = router;
