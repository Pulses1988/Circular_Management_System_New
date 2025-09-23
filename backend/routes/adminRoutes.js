const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authenticateToken = require("../authMiddleware");


router.get("/",adminController.getAllAdmins);
router.get("/withRelations",authenticateToken, adminController.getAdminsWithRelations);
router.get("/:id",authenticateToken, adminController.getAdminById);
router.post("/", adminController.createAdmin);
router.delete("/:id",authenticateToken, adminController.deleteAdmin);
router.post("/login",adminController.login);

module.exports = router;
