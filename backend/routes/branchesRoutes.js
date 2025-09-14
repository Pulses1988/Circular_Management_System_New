const express = require("express");
const router = express.Router();
const branchController = require("../controllers/branchesController");

router.get("/", branchController.getAllBranchesWithHeadOffice);
router.get("/:id", branchController.getBranchById);
router.post("/", branchController.createBranch);
router.delete("/:id", branchController.deleteBranch);

module.exports = router;
