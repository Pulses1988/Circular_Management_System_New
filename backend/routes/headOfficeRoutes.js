const express = require("express");
const router = express.Router();
const headOfficeController = require("../controllers/headOfficeController");
const authenticateToken = require("../authMiddleware");

router.get("/", authenticateToken, headOfficeController.getAllHeadOffice);
router.get("/:id", authenticateToken, headOfficeController.getHeadOfficeById);
router.post("/", authenticateToken, headOfficeController.createHeadOffice);
router.delete("/:id", authenticateToken, headOfficeController.deleteHeadOffice);

module.exports = router;
