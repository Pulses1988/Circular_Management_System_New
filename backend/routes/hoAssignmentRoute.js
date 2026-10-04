const express = require("express");

const router = express.Router();

const hoAssignmentController = require("../controllers/hoAssignmentController");


// Create HO Assignment
router.post(
  "/create",
  hoAssignmentController.createHOAssignment
);


// Get all HO Assignments
router.get(
  "/",
  hoAssignmentController.getAllHOAssignments
);


// Get HO Assignment by ID
router.get(
  "/:id",
  hoAssignmentController.getHOAssignmentById
);


// Get assignments for employee
router.get(
  "/employee/:employee_id",
  hoAssignmentController.getAssignmentsByEmployeeId
);

// Mark HO Assignment as read

router.put(

  "/mark-seen",

  hoAssignmentController.markAssignmentAsSeen

);

module.exports = router;