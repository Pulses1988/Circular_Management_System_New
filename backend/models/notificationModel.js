const db = require("../config/db");

exports.createNotification = async (notificationData) => {
  const { circular_id, recipient_employee_id, sender_employee_id, notification_type, message_preview } = notificationData;
  
  const [result] = await db.query(
    `INSERT INTO circular_notifications (circular_id, recipient_employee_id, sender_employee_id, notification_type, message_preview)
     VALUES (?, ?, ?, ?, ?)`,
    [circular_id, recipient_employee_id, sender_employee_id, notification_type, message_preview]
  );
  
  return result.insertId;
};

exports.getUnreadNotificationsByEmployee = async (employee_id) => {
  const [rows] = await db.query(
    `SELECT 
      cn.notification_id,
      cn.circular_id,
      cn.notification_type,
      cn.message_preview,
      cn.is_read,
      cn.created_at,
      c.title AS circular_title,
      c.circular_code,
      e.first_name AS sender_first_name,
      e.last_name AS sender_last_name
    FROM circular_notifications cn
    JOIN circulars c ON cn.circular_id = c.id
    JOIN employees e ON cn.sender_employee_id = e.id
    WHERE cn.recipient_employee_id = ? AND cn.is_read = FALSE
    ORDER BY cn.created_at DESC
    LIMIT 20`,
    [employee_id]
  );
  
  return rows;
};

exports.getUnreadCount = async (employee_id) => {
  const [rows] = await db.query(
    `SELECT COUNT(*) as count FROM circular_notifications 
     WHERE recipient_employee_id = ? AND is_read = FALSE`,
    [employee_id]
  );
  
  return rows[0].count;
};

exports.markAsRead = async (notification_id) => {
  await db.query(
    `UPDATE circular_notifications SET is_read = TRUE WHERE notification_id = ?`,
    [notification_id]
  );
};

exports.markAllAsRead = async (employee_id) => {
  await db.query(
    `UPDATE circular_notifications SET is_read = TRUE WHERE recipient_employee_id = ?`,
    [employee_id]
  );
};