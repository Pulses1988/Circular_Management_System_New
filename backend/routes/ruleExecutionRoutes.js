const express = require("express");

const router = express.Router();

const ruleExecutionController =
require("../controllers/ruleExecutionController");

router.get(
    "/rule-executions",
    ruleExecutionController.getAllExecutions
);

module.exports = router;