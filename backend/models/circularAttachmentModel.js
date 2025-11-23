const db = require("../config/db");

// ✅ Create a new attachment
exports.createAttachment = async (attachmentData) => {
  const { circular_id, employee_id, chat_id, file_name, file_type, file_size, file_data } = attachmentData;
  
  const [result] = await db.query(
    `INSERT INTO circular_attachments (circular_id, employee_id, chat_id, file_name, file_type, file_size, file_data)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [circular_id, employee_id, chat_id, file_name, file_type, file_size, file_data]
  );
  
  return result.insertId;
};

// ✅ Get attachment by ID (with file data)
exports.getAttachmentById = async (attachment_id) => {
  const [rows] = await db.query(
    `SELECT 
      attachment_id,
      circular_id,
      employee_id,
      chat_id,
      file_name,
      file_type,
      file_size,
      file_data,
      uploaded_at
    FROM circular_attachments
    WHERE attachment_id = ?`,
    [attachment_id]
  );
  
  return rows[0];
};

// ✅ Get attachment metadata (without file data for listing)
exports.getAttachmentMetadataById = async (attachment_id) => {
  const [rows] = await db.query(
    `SELECT 
      ca.attachment_id,
      ca.circular_id,
      ca.employee_id,
      ca.chat_id,
      ca.file_name,
      ca.file_type,
      ca.file_size,
      ca.uploaded_at,
      e.first_name,
      e.last_name
    FROM circular_attachments ca
    LEFT JOIN employees e ON ca.employee_id = e.id
    WHERE ca.attachment_id = ?`,
    [attachment_id]
  );
  
  return rows[0];
};

// ✅ Get all attachments for a circular (metadata only)
exports.getAttachmentsByCircularId = async (circular_id) => {
  const [rows] = await db.query(
    `SELECT 
      ca.attachment_id,
      ca.circular_id,
      ca.employee_id,
      ca.chat_id,
      ca.file_name,
      ca.file_type,
      ca.file_size,
      ca.uploaded_at,
      e.first_name,
      e.last_name
    FROM circular_attachments ca
    LEFT JOIN employees e ON ca.employee_id = e.id
    WHERE ca.circular_id = ?
    ORDER BY ca.uploaded_at DESC`,
    [circular_id]
  );
  
  return rows;
};

// ✅ Get attachments for a specific chat message
exports.getAttachmentsByChatId = async (chat_id) => {
  const [rows] = await db.query(
    `SELECT 
      attachment_id,
      circular_id,
      employee_id,
      chat_id,
      file_name,
      file_type,
      file_size,
      uploaded_at
    FROM circular_attachments
    WHERE chat_id = ?
    ORDER BY uploaded_at ASC`,
    [chat_id]
  );
  
  return rows;
};

// ✅ Delete an attachment
exports.deleteAttachment = async (attachment_id) => {
  await db.query(
    `DELETE FROM circular_attachments WHERE attachment_id = ?`,
    [attachment_id]
  );
};

// ✅ Get total size of attachments by circular
exports.getTotalSizeByCircular = async (circular_id) => {
  const [rows] = await db.query(
    `SELECT SUM(file_size) as total_size 
     FROM circular_attachments 
     WHERE circular_id = ?`,
    [circular_id]
  );
  
  return rows[0]?.total_size || 0;
};