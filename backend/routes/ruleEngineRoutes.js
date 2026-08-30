const express = require("express");

const router = express.Router();

const ruleEngineController = require("../controllers/ruleEngineController");
const authenticateToken = require('../authMiddleware');

function requireAdmin(req, res, next) {
  if (!req.user || !['HO_ADMIN', 'BRANCH_ADMIN'].includes(req.user.admin_type)) {
    return res.status(403).json({ success: false, message: 'Admin access is required.' });
  }
  next();
}

router.use(authenticateToken, requireAdmin);

// Create Rule
router.post("/", ruleEngineController.createRule);

// Get All Rules
router.get("/", ruleEngineController.getAllRules);

// Get Rule By Id
router.get("/:id", ruleEngineController.getRuleById);

// Update Rule
router.put("/:id", ruleEngineController.updateRule);
router.patch("/:id/status", ruleEngineController.setRuleStatus);

// Delete Rule
router.delete("/:id", ruleEngineController.deleteRule);

module.exports = router;
