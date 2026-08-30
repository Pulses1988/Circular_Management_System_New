const express = require("express");
const router = express.Router();

const recurrenceController =
require("../controllers/recurrenceController");


router.get(
"/run",
recurrenceController.runRecurrence
);


module.exports = router;