const express = require("express");
const router = express.Router();
const repeatCycleController = require("../controllers/repeatCyclesController");
const authenticateToken = require("../authMiddleware");

// Public routes (if needed) or protected routes
router.get("/", authenticateToken, repeatCycleController.getAllRepeatCycles);
router.get("/:id", authenticateToken, repeatCycleController.getRepeatCycleById);
router.post("/", authenticateToken, repeatCycleController.createRepeatCycle);
router.put("/:id", authenticateToken, repeatCycleController.updateRepeatCycle);
router.delete(
  "/:id",
  authenticateToken,
  repeatCycleController.deleteRepeatCycle
);

module.exports = router;
