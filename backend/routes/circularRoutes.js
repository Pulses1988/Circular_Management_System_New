const express = require("express");
const router = express.Router();
const circularController = require("../controllers/circularController");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/upload",
  upload.single("pdfFile"),
  circularController.createCircular
);

// get All Approved Circulars
router.get(
  "/getAllApprovedCirculars",
  circularController.getAllApprovedCirculars
);

router.get(
  "/getAllDataById/:id",
  circularController.getCircularapproverandemployeeById
);

// Get by creater Id (specific first)
router.get("/creator/:createrId", circularController.getCircularByCreaterId);

// Get by ID (generic last)
router.get("/:id", circularController.getCircularById);

// Get All
router.get("/", circularController.getAllCirculars);

// Get by ID
router.get("/:id", circularController.getCircularById);

router.get(
  "/all/:employee_id",
  circularController.getAllCircularsByEmployeeIdWithTrackingDetails
);

router.get("/circular/:circular_id", circularController.getCircularDetailsById);
// Update
router.put("/:id", upload.single("pdfFile"), circularController.updateCircular);

// Delete
router.delete("/:id", circularController.deleteCircular);

module.exports = router;
