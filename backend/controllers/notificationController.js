const notificationModel = require("../models/notificationModel");

exports.getUnreadNotifications = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const notifications = await notificationModel.getUnreadNotificationsByEmployee(employee_id);
    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const count = await notificationModel.getUnreadCount(employee_id);
    res.status(200).json({ count });
  } catch (error) {
    console.error("Error fetching notification count:", error);
    res.status(500).json({ error: "Failed to fetch notification count" });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { notification_id } = req.params;
    await notificationModel.markAsRead(notification_id);
    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const { employee_id } = req.params;
    await notificationModel.markAllAsRead(employee_id);
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
};