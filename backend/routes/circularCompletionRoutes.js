const express = require("express");
const router = express.Router();
const circularCompletionController = require("../controllers/circularCompletionController");

router.post("/complete", circularCompletionController.completeCircular);
router.get("/:circular_id", circularCompletionController.getCompletionDetails);

module.exports = router;