const express = require("express");

const router = express.Router();

const eventLogController =
require("../controllers/eventLogController");


router.get(
    "/",
    eventLogController.getAllEvents
);

module.exports = router;