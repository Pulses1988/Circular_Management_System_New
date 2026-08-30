const notificationModel = require('../models/notificationModel');
const circularModel = require('../models/circularModel');
const circularTrackingModel = require('../models/circularTrackingModel');
const ruleExecutionModel = require('../models/ruleExecutionModel');

function employeeList(employees, marker) {
  return employees.map(({ employee_name }) => `${marker} ${employee_name}`).join('\n');
}

async function getCircularAndEmployees(circularId) {
  const [circularRows] = await circularModel.getCircularById(circularId);
  const circular = circularRows[0];
  if (!circular || !circular.creator_employee_id) return {};

  const [employees] = await circularTrackingModel.getCompletionStatusEmployees(circularId);
  return { circular, employees };
}

async function createCreatorNotification({ circular, message, senderEmployeeId, io }) {
  const notificationId = await notificationModel.createNotification({
    circular_id: circular.id,
    recipient_employee_id: circular.creator_employee_id,
    sender_employee_id: senderEmployeeId || circular.creator_employee_id,
    notification_type: 'message',
    message_preview: message,
  });

  if (io) {
    io.to(`notifications-${circular.creator_employee_id}`).emit('new-notification', {
      notification_id: notificationId,
      circular_id: circular.id,
      notification_type: 'message',
      message_preview: message,
      circular_title: circular.title,
      circular_code: circular.circular_code,
      redirect_to: 'details',
    });
  }
}

async function notifyCreatorOfCompletionStatus({ circularId, employeeId, io }) {
  const { circular, employees } = await getCircularAndEmployees(circularId);
  if (!circular || !employees.length) return;

  const completed = employees.filter((employee) => Number(employee.is_completed) === 1);
  const pending = employees.filter((employee) => Number(employee.is_completed) !== 1);
  const message = [
    'Circular Completion Update',
    '',
    `Circular: ${circular.title}`,
    '',
    'Completed Employees:',
    employeeList(completed, '\u2713') || '- None',
    '',
    'Not Completed Employees:',
    employeeList(pending, '-') || '- None',
  ].join('\n');

  await createCreatorNotification({ circular, message, senderEmployeeId: employeeId, io });
}

async function notifyCreatorAllEmployeesCompleted({ circularId, employeeId, io, ruleId }) {
  // ALL_EMPLOYEES_COMPLETED is retained as-is and can be emitted again by the
  // existing completion endpoint.  This guard makes this new notification
  // once-per-rule/per-circular without changing that existing event behavior.
  if (ruleId) {
    const [priorExecutions] = await ruleExecutionModel.hasSuccessfulExecution(
      ruleId,
      'ALL_EMPLOYEES_COMPLETED',
      'SEND_ALL_EMPLOYEES_COMPLETED_NOTIFICATION',
      circularId,
    );
    if (priorExecutions.length) return;
  }

  const { circular, employees } = await getCircularAndEmployees(circularId);
  if (!circular || !employees.length || employees.some((employee) => Number(employee.is_completed) !== 1)) return;

  const message = [
    'Circular Completed',
    '',
    `All employees assigned to "${circular.title}" have marked the circular as completed.`,
    '',
    `${employees.length} of ${employees.length} employees have completed the circular.`,
  ].join('\n');

  await createCreatorNotification({ circular, message, senderEmployeeId: employeeId, io });
}

module.exports = {
  notifyCreatorOfCompletionStatus,
  notifyCreatorAllEmployeesCompleted,
};
