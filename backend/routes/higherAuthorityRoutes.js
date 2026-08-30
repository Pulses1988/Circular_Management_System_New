const express = require("express");

const router = express.Router();

const higherAuthorityController =
require("../controllers/higherAuthorityController");

router.get(
    "/pending/:employeeId",
    higherAuthorityController.getPendingCirculars
);

module.exports = router;