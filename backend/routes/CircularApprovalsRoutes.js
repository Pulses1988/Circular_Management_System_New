const express = require("express");
const router = express.Router();
const circularApprovalController = require("../controllers/circularApprovalsController");
const authenticateToken = require("../authMiddleware");

// CRUD routes
router.get(
  "/",
  authenticateToken,
  circularApprovalController.getAllCircularApprovals
);
router.get(
  "/withRelations",
  authenticateToken,
  circularApprovalController.getAllCircularApprovalsWithRelations
);
router.get(
  "/:approver_id/assigned",
  authenticateToken,
  circularApprovalController.getAssignedCirculars
);
router.get(
  "/:approver_id/get-circular-by-emp",
  authenticateToken,
  circularApprovalController.getCircularApprovalByEmpId
);
router.get(
  "/:id",
  authenticateToken,
  circularApprovalController.getCircularApprovalById
);
router.post(
  "/",
  authenticateToken,
  circularApprovalController.createCircularApproval
);
router.put(
  "/:id",
  authenticateToken,
  circularApprovalController.updateCircularApproval
);
router.delete(
  "/:id",
  authenticateToken,
  circularApprovalController.deleteCircularApproval
);
router.put(
  "/:circularId/:approverId/mark-seen",
  authenticateToken,
  circularApprovalController.markAsSeen
);

// Approve circular
router.put(
  "/:circularId/:approverId/approve",
  authenticateToken,
  circularApprovalController.approve
);

// Reject circular
router.put(
  "/:circularId/:approverId/reject",
  authenticateToken,
  circularApprovalController.reject
);

module.exports = router;
