const express = require("express");
const router = express.Router();
const headOfficeController = require("../controllers/headOfficeController");

router.get("/", headOfficeController.getAllHeadOffice);
router.get("/:id", headOfficeController.getHeadOfficeById);
router.post("/", headOfficeController.createHeadOffice);
router.delete("/:id", headOfficeController.deleteHeadOffice);

module.exports = router;
