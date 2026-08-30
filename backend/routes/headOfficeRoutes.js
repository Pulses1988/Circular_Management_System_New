const express = require("express");
const router = express.Router();
const headOfficeController = require("../controllers/headOfficeController");
const authenticateToken = require("../authMiddleware");

// Get Head Office configuration
router.get(
  "/configuration/:id",
  authenticateToken,
  headOfficeController.getHeadOfficeConfiguration
);

// Get Head Office
router.get(
  "/",
  authenticateToken,
  headOfficeController.getAllHeadOffice
);

// Get Head Office by ID
router.get(
  "/:id",
  authenticateToken,
  headOfficeController.getHeadOfficeById
);

// Create Head Office - only allowed when none exists
router.post(
  "/",
  authenticateToken,
  headOfficeController.createHeadOffice
);

// Update existing Head Office
router.put(
  "/:id",
  authenticateToken,
  headOfficeController.updateHeadOffice
);

module.exports = router;