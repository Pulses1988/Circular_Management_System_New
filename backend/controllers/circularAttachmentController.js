const circularAttachmentModel = require("../models/circularAttachmentModel");

// ✅ Upload attachment
exports.uploadAttachment = async (req, res) => {
  try {
    console.log('📤 Request body:', req.body); // ADD THIS
    console.log('📎 File:', req.file); // ADD THIS
     const circular_id = req.body.circular_id;
    const employee_id = req.body.employee_id;
    const chat_id = req.body.chat_id;


    if (!circular_id || !employee_id) {
      return res.status(400).json({ error: "circular_id and employee_id are required" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const file = req.file;
    
    // File size limit: 10MB
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return res.status(400).json({ error: "File size exceeds 10MB limit" });
    }

    // Allowed file types
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ error: "File type not allowed" });
    }

    const attachmentData = {
      circular_id: parseInt(circular_id),
      employee_id: parseInt(employee_id),
      chat_id: chat_id ? parseInt(chat_id) : null,
      file_name: file.originalname,
      file_type: file.mimetype,
      file_size: file.size,
      file_data: file.buffer
    };

    const attachmentId = await circularAttachmentModel.createAttachment(attachmentData);
    
    // Get attachment metadata (without file data)
    const attachmentMetadata = await circularAttachmentModel.getAttachmentMetadataById(attachmentId);

    // Get Socket.IO instance
    const io = req.app.get('io');
    
    if (io) {
      const chatRoomName = `circular-chat-${circular_id}`;
      
      // Emit to circular chat room
      io.to(chatRoomName).emit('new-attachment-uploaded', {
        attachment: attachmentMetadata,
        circular_id: parseInt(circular_id),
        chat_id: chat_id ? parseInt(chat_id) : null
      });
      
      console.log(`✅ Attachment uploaded event emitted to room: ${chatRoomName}`);
    }

    res.status(201).json({
      message: "Attachment uploaded successfully",
      attachment_id: attachmentId,
      attachment: attachmentMetadata
    });
  } catch (error) {
    console.error("Error uploading attachment:", error);
    res.status(500).json({ error: "Failed to upload attachment" });
  }
};

// ✅ Download/Get attachment by ID
exports.getAttachment = async (req, res) => {
  try {
    const { attachment_id } = req.params;
    
    const attachment = await circularAttachmentModel.getAttachmentById(attachment_id);
    
    if (!attachment) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    // Set appropriate headers for file download
    res.setHeader('Content-Type', attachment.file_type);
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.file_name}"`);
    res.setHeader('Content-Length', attachment.file_size);
    
    // Send file data
    res.send(attachment.file_data);
  } catch (error) {
    console.error("Error downloading attachment:", error);
    res.status(500).json({ error: "Failed to download attachment" });
  }
};

// ✅ Get all attachments for a circular (metadata only)
exports.getAttachmentsByCircular = async (req, res) => {
  try {
    const { circular_id } = req.params;
    
    const attachments = await circularAttachmentModel.getAttachmentsByCircularId(circular_id);
    
    res.status(200).json(attachments);
  } catch (error) {
    console.error("Error fetching attachments:", error);
    res.status(500).json({ error: "Failed to fetch attachments" });
  }
};

// ✅ Get attachments for a specific chat
exports.getAttachmentsByChat = async (req, res) => {
  try {
    const { chat_id } = req.params;
    
    const attachments = await circularAttachmentModel.getAttachmentsByChatId(chat_id);
    
    res.status(200).json(attachments);
  } catch (error) {
    console.error("Error fetching chat attachments:", error);
    res.status(500).json({ error: "Failed to fetch chat attachments" });
  }
};

// ✅ Delete attachment
exports.deleteAttachment = async (req, res) => {
  try {
    const { attachment_id } = req.params;
    
    await circularAttachmentModel.deleteAttachment(attachment_id);
    
    res.status(200).json({ message: "Attachment deleted successfully" });
  } catch (error) {
    console.error("Error deleting attachment:", error);
    res.status(500).json({ error: "Failed to delete attachment" });
  }
};

// ✅ Get total storage used by circular
exports.getCircularStorageSize = async (req, res) => {
  try {
    const { circular_id } = req.params;
    
    const totalSize = await circularAttachmentModel.getTotalSizeByCircular(circular_id);
    
    res.status(200).json({ 
      circular_id: parseInt(circular_id),
      total_size_bytes: totalSize,
      total_size_mb: (totalSize / (1024 * 1024)).toFixed(2)
    });
  } catch (error) {
    console.error("Error calculating storage:", error);
    res.status(500).json({ error: "Failed to calculate storage" });
  }
};