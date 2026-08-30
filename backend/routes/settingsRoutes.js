const express = require("express");
const router = express.Router();

const settingsController =
  require("../controllers/settingsController");

router.get(
  "/max-approvers",
  settingsController.getMaxApprovers
);

router.put(
  "/max-approvers",
  settingsController.updateMaxApprovers
);

module.exports = router;