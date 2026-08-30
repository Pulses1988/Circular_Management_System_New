const express = require("express");
const router = express.Router();

const memberTypeController = require("../controllers/memberTypeController");

/**
 * =====================================
 * GET APIs
 * =====================================
 */

// Get all member types
router.get("/", memberTypeController.getAllMemberTypes);

// Get active member types
router.get("/active", memberTypeController.getActiveMemberTypes);

// Get member type by ID
router.get("/:id", memberTypeController.getMemberTypeById);

/**
 * =====================================
 * POST APIs
 * =====================================
 */

// Create member type
router.post("/", memberTypeController.createMemberType);

/**
 * =====================================
 * PUT APIs
 * =====================================
 */

// Update member type
router.put("/:id", memberTypeController.updateMemberType);

/**
 * =====================================
 * DELETE APIs
 * =====================================
 */

// Delete member type
router.delete("/:id", memberTypeController.deleteMemberType);

module.exports = router;