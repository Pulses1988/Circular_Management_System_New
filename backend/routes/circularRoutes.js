const express = require("express");
const router = express.Router();
const circularController = require("../controllers/circularController");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/upload",
  upload.single("pdfFile"), // name of the file field in your form
  circularController.createCircular
);

// Get All
router.get("/", circularController.getAllCirculars);

// Get by ID
router.get("/:id", circularController.getCircularById);

// Update
router.put("/:id", upload.single("pdfFile"), circularController.updateCircular);

// Delete
router.delete("/:id", circularController.deleteCircular);

module.exports = router;
