const circularTrackingModel = require("../models/circularTrackingModel");
const notificationModel = require("../models/notificationModel");

exports.sendPendingReminders = async (io) => {
  try {
    const pendingEmployees =
      await circularTrackingModel.getPendingEmployeesForReminder();

    console.log(
      `Found ${pendingEmployees.length} pending reminder(s)`
    );

    for (const item of pendingEmployees) {
      const message = `Reminder: Circular "${item.title}" is still pending for completion.`;

      const notificationId =
        await notificationModel.createNotification({
          circular_id: item.circular_id,
          recipient_employee_id: item.employee_id,
          sender_employee_id: item.creator_employee_id,
          notification_type: "message",
          message_preview: message,
        });

      // Real-time notification
      if (io) {
        io.to(`notifications-${item.employee_id}`).emit(
          "new-notification",
          {
            notification_id: notificationId,
            circular_id: item.circular_id,
            notification_type: "message",
            message_preview: message,
            circular_title: item.title,
            circular_code: item.circular_code,
          }
        );
      }

      // Prevent duplicate reminders
      await circularTrackingModel.updateLastReminderAt(
        item.track_id
      );

      console.log(
        `Reminder sent to employee ${item.employee_id} for circular ${item.circular_id}`
      );
    }

    return {
      sent: pendingEmployees.length,
    };
  } catch (error) {
    console.error("Error sending pending reminders:", error);
    throw error;
  }
};