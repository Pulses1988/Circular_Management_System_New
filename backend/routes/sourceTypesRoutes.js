const express = require("express");
const router = express.Router();
const sourceTypeController = require("../controllers/sourceTypesController");
const authenticateToken = require("../authMiddleware");
const { route } = require("./employeesRoutes");

router.get("/", authenticateToken, sourceTypeController.getAllSourceTypes);
router.get("/:id", authenticateToken, sourceTypeController.getSourceTypeById);
router.post("/",authenticateToken, sourceTypeController.createSourceType);
router.put("/:id", authenticateToken, sourceTypeController.updateSourceType);
router.delete("/:id", authenticateToken, sourceTypeController.deleteSourceType);

module.exports = router;
