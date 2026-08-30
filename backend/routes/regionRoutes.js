const express = require("express");
const router = express.Router();

const regionController = require("../controllers/regionController");
const authenticateToken = require("../authMiddleware");

// Get all Regions
router.get(
  "/",
  authenticateToken,
  regionController.getAllRegions
);

// Get Region by ID
router.get(
  "/:id",
  authenticateToken,
  regionController.getRegionById
);

// Create Region
router.post(
  "/",
  authenticateToken,
  regionController.createRegion
);

//update region 
router.put(
  "/:id",
  authenticateToken,
  regionController.updateRegion
);




// Delete Region
router.delete(
  "/:id",
  authenticateToken,
  regionController.deleteRegion
);

module.exports = router;