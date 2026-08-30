const express = require("express");
const router = express.Router();

const zoneController = require("../controllers/zoneController");
const authenticateToken = require("../authMiddleware");

// Get all Zones
router.get(
  "/",
  authenticateToken,
  zoneController.getAllZones
);

// Get Zone by ID
router.get(
  "/:id",
  authenticateToken,
  zoneController.getZoneById
);

// Create Zone
router.post(
  "/",
  authenticateToken,
  zoneController.createZone
); 


//Update Zone 

router.put(
  "/:id",
  authenticateToken,
  zoneController.updateZone
);

// Delete Zone
router.delete(
  "/:id",
  authenticateToken,
  zoneController.deleteZone
);

// Get Zones by Region
router.get(
  "/region/:regionId",
  authenticateToken,
  zoneController.getZonesByRegionId
);

module.exports = router;