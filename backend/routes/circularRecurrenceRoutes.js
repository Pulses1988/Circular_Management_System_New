const express = require("express");
const router = express.Router();
const circularRecurrenceController = require("../controllers/circularRecurrenceController");

router.post("/complete-and-renew", circularRecurrenceController.completeCycleAndRenew);
router.get("/history/:circular_id", circularRecurrenceController.getRecurrenceHistory);

module.exports = router;