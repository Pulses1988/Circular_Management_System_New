const db = require("../config/db");

// ✅ Create a new chat message
exports.createChat = async (chatData) => {
  const { circular_id, employee_id, message, is_system_message } = chatData;
  
  const [result] = await db.query(
    `INSERT INTO circular_chats (circular_id, employee_id, message, is_system_message)
     VALUES (?, ?, ?, ?)`,
    [circular_id, employee_id, message, is_system_message|| false]
  );
  return result.insertId;
};

// ✅ Fetch all chats for a specific circular
exports.getChatsByCircularId = async (circular_id) => {
  const [rows] = await db.query(
    `
    SELECT 
      cc.chat_id,
      cc.circular_id,
      cc.employee_id,
      e.name AS employee_name,
      cc.message,
      cc.is_system_message,
      cc.created_at
    FROM circular_chats cc
    LEFT JOIN employees e ON cc.employee_id = e.id
    WHERE cc.circular_id = ?
    ORDER BY cc.created_at ASC
    `,
    [circular_id]
  );
  for (let chat of rows) {
    const [attachments] = await db.query(
      `SELECT attachment_id, file_name, file_type, file_size, uploaded_at
       FROM circular_attachments
       WHERE chat_id = ?`,
      [chat.chat_id]
    );
    chat.attachments = attachments;
  }
  return rows;
};

// Get chat by ID with employee details
exports.getChatById = async (chat_id) => {
  const [rows] = await db.query(
    `
    SELECT 
      cc.chat_id,
      cc.circular_id,
      cc.employee_id,
      e.first_name,
      e.last_name,
      cc.message,
      cc.is_system_message,
      cc.created_at
    FROM circular_chats cc
    LEFT JOIN employees e ON cc.employee_id = e.id
    WHERE cc.chat_id = ?
    `,
    [chat_id]
  );
  return rows[0];
};

// ✅ Delete a specific chat (optional)
exports.deleteChat = async (chat_id) => {
  await db.query(`DELETE FROM circular_chats WHERE chat_id = ?`, [chat_id]);
};


