const db = require("../config/db");

// ✅ Create a new chat message
exports.createChat = async (chatData) => {
  const { circular_id, employee_id, message } = chatData;
  const [result] = await db.query(
    `INSERT INTO circular_chats (circular_id, employee_id, message)
     VALUES (?, ?, ?)`,
    [circular_id, employee_id, message]
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
      cc.created_at
    FROM circular_chats cc
    LEFT JOIN employees e ON cc.employee_id = e.id
    WHERE cc.circular_id = ?
    ORDER BY cc.created_at ASC
    `,
    [circular_id]
  );
  return rows;
};

// ✅ Delete a specific chat (optional)
exports.deleteChat = async (chat_id) => {
  await db.query(`DELETE FROM circular_chats WHERE chat_id = ?`, [chat_id]);
};
