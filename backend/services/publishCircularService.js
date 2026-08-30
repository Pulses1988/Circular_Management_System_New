const notificationModel = require("../models/notificationModel");
const circularModel = require("../models/circularModel");
const employeeModel = require("../models/employeesModal");
const circularVisibilityModel = require("../models/circularVisibilityModel");

async function notifyEmployeesAfterPublish(data) {

    const { circularId, approverId, io } = data;

    // Get circular
    const [circularRows] = await circularModel.getCircularById(circularId);
    const circular = circularRows[0];

    // Get approver
    const [approverRows] = await employeeModel.getEmployeeById(approverId);
    const approver = approverRows[0];

    // Get employees who can see this circular
    const [visibleEmployees] =
        await circularVisibilityModel.getEmployeesByCircularId(circularId);

    if (!visibleEmployees?.length) {
        console.log("No employees found for circular");
        return;
    }

    const employeesToNotify = visibleEmployees.filter(
        emp => emp.employee_id !== circular.creator_employee_id
    );

    for (const emp of employeesToNotify) {

        const notificationId = await notificationModel.createNotification({
            circular_id: circularId,
            recipient_employee_id: emp.employee_id,
            sender_employee_id: approverId,
            notification_type: 'message',
            message_preview:
                `New circular "${circular.title}" has been fully approved and is now available.`,
            redirect_to: 'details'
        });

        if (io) {
            io.to(`notifications-${emp.employee_id}`).emit('new-notification', {
                notification_id: notificationId,
                circular_id: circularId,
                sender_first_name: approver.first_name,
                sender_last_name: approver.last_name,
                notification_type: 'message',
                message_preview:
                    `New circular "${circular.title}" has been fully approved and is now available.`,
                circular_title: circular.title,
                circular_code: circular.circular_code,
                redirect_to: 'details'
            });
        }
    }

    console.log(`Employee notifications sent for circular ${circularId}`);
}

module.exports = {
    notifyEmployeesAfterPublish
};