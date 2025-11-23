const express = require("express");
const router = express.Router();
const multer = require("multer");
const circularAttachmentController = require("../controllers/circularAttachmentController");

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// ✅ Upload attachment (single file)
router.post("/upload", upload.single('file'), circularAttachmentController.uploadAttachment);

// ✅ Get/Download attachment by ID
router.get("/:attachment_id", circularAttachmentController.getAttachment);

// ✅ Get all attachments for a circular
router.get("/circular/:circular_id", circularAttachmentController.getAttachmentsByCircular);

// ✅ Get attachments for a specific chat
router.get("/chat/:chat_id", circularAttachmentController.getAttachmentsByChat);

// ✅ Get storage size for circular
router.get("/circular/:circular_id/storage", circularAttachmentController.getCircularStorageSize);

// ✅ Delete attachment
router.delete("/:attachment_id", circularAttachmentController.deleteAttachment);

module.exports = router;