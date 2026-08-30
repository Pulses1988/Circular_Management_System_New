const notificationModel = require("../models/notificationModel");
const circularModel = require("../models/circularModel");
const employeeModel = require("../models/employeesModal");

async function notifyCreatorOfRejection(data) {
  const { circularId, approverId, comments, io } = data;
  const [circularRows] = await circularModel.getCircularById(circularId);
  const circular = circularRows[0];
  if (!circular || !circular.creator_employee_id) return;

  const [approverRows] = await employeeModel.getEmployeeById(approverId);
  const approver = approverRows[0];
  const approverName = [approver?.first_name, approver?.last_name]
    .filter(Boolean).join(" ") || `Employee ${approverId}`;
  const message = `Your circular "${circular.title}" has been rejected by ${approverName}.${comments ? ` Reason: ${comments}` : ""}`;

  const notificationId = await notificationModel.createNotification({
    circular_id: circularId,
    recipient_employee_id: circular.creator_employee_id,
    sender_employee_id: approverId,
    notification_type: "message",
    message_preview: message,
  });

  if (io) {
    io.to(`notifications-${circular.creator_employee_id}`).emit("new-notification", {
      notification_id: notificationId,
      circular_id: circularId,
      sender_first_name: approver?.first_name,
      sender_last_name: approver?.last_name,
      notification_type: "message",
      message_preview: message,
      circular_title: circular.title,
      circular_code: circular.circular_code,
      redirect_to: "details",
    });
  }
}

module.exports = { notifyCreatorOfRejection };
