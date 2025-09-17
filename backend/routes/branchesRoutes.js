const express = require("express");
const router = express.Router();
const branchController = require("../controllers/branchesController");
const authenticateToken = require("../authMiddleware")

router.get("/", authenticateToken, branchController.getAllBranchesWithHeadOffice);
router.get("/:id",authenticateToken, branchController.getBranchById);
router.post("/",authenticateToken, branchController.createBranch);
router.delete("/:id",authenticateToken, branchController.deleteBranch);
router.put("/:id",authenticateToken, branchController.updateBranch);

module.exports = router;
