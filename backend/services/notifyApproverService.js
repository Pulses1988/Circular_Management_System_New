const notificationModel = require("../models/notificationModel");
const circularModel = require("../models/circularModel");
const employeeModel = require("../models/employeesModal");

async function notifyApprover(data) {

    const { circularId, approverId, creatorId, io } = data;

    // Get Circular
    const [circularRows] = await circularModel.getCircularById(circularId);
    const circular = circularRows[0];

    // Get Creator
    const [creatorRows] = await employeeModel.getEmployeeById(creatorId);
    const creator = creatorRows[0];

    // Create Notification
    const notificationId = await notificationModel.createNotification({

        circular_id: circularId,
        recipient_employee_id: approverId,
        sender_employee_id: creatorId,
        notification_type: "message",
        message_preview: `New circular "${circular.title}" requires your approval`,
        redirect_to: "details"

    });

    // Send Socket Notification
    if (io) {

        io.to(`notifications-${approverId}`).emit("new-notification", {

            notification_id: notificationId,
            circular_id: circularId,
            sender_first_name: creator.first_name,
            sender_last_name: creator.last_name,
            notification_type: "message",
            message_preview: `New circular "${circular.title}" requires your approval`,
            circular_title: circular.title,
            circular_code: circular.circular_code,
            redirect_to: "details"

        });

    }

    console.log(`Approver ${approverId} notified`);

}

module.exports = {
    notifyApprover
};