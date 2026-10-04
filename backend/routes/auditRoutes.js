const express = require("express");

const router = express.Router();

const auditController = require("../controllers/auditController");


/* ============================================
   GET ALL AUDIT LOGS
   GET /api/audit
============================================ */

router.get("/", auditController.getAuditLogs);

// Delete audit log
router.delete("/:id", auditController.deleteAuditLog);

module.exports = router;