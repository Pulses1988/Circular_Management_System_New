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

module.exports = router;
