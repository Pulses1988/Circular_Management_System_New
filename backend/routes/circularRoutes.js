const express = require("express");
const router = express.Router();
const circularController = require("../controllers/circularController");
const multer = require("multer");
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 10 * 1024 * 1024, // 10MB for JSON field data
    fileSize: 50 * 1024 * 1024,  // 50MB for PDF files
    fields: 20,                   // max number of non-file fields
  }
});

router.post(
  "/upload",
  upload.single("pdfFile"),
  circularController.createCircular
);
 


//Completion Route
router.post(
 "/creator-mark-completed",
 circularController.creatorMarkCompleted
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

router.get('/activity-summary/:circular_id', circularController.getCircularActivitySummary);

// Delete
router.delete("/:id", circularController.deleteCircular); 



module.exports = router;
