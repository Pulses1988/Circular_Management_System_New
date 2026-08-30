const db = require('../config/db');
const notificationModel = require('../models/notificationModel');
const ruleExecutionModel = require('../models/ruleExecutionModel');

const REMINDER_ACTION = 'SEND_READ_REMINDER';

exports.startForPublishedCircular = async ({ circularId }) => {
  const [rules] = await db.query(
    `SELECT id, rule_name FROM rule_master
     WHERE status = 'ACTIVE' AND event_name = 'CIRCULAR_PUBLISHED'
       AND action_name = ?`,
    [REMINDER_ACTION]
  );

  for (const rule of rules) {
    const [existing] = await db.query(
      `SELECT id FROM rule_execution_history
       WHERE rule_id = ? AND entity_id = ? AND event_name = 'CIRCULAR_PUBLISHED'
       LIMIT 1`,
      [rule.id, circularId]
    );
    if (!existing.length) {
      await ruleExecutionModel.saveExecution({
        rule_id: rule.id,
        event_name: 'CIRCULAR_PUBLISHED',
        rule_name: rule.rule_name,
        action_name: REMINDER_ACTION,
        status: 'STARTED',
        entity_id: circularId,
      });
    }
  }
};

function intervalExpression(unit) {
  return { MINUTE: 'MINUTE', HOUR: 'HOUR', DAY: 'DAY' }[unit];
}

exports.processDueReminders = async (io) => {
  const [rules] = await db.query(
    `SELECT rm.id, rm.rule_name, rm.reminder_frequency_value, rm.reminder_frequency_unit, rm.notify_creator
     FROM rule_master rm
     WHERE rm.status = 'ACTIVE' AND rm.event_name = 'CIRCULAR_PUBLISHED'
       AND rm.action_name = ?`,
    [REMINDER_ACTION]
  );
  let remindersSent = 0;
  let creatorUpdates = 0;

  for (const rule of rules) {
    const interval = intervalExpression(rule.reminder_frequency_unit);
    if (!interval || !Number.isInteger(Number(rule.reminder_frequency_value)) || Number(rule.reminder_frequency_value) < 1) continue;

    const [dueRows] = await db.query(
      `SELECT ct.track_id, ct.circular_id, ct.employee_id, c.title, c.circular_code,
              c.creator_employee_id
       FROM rule_execution_history reh
       JOIN circulars c ON c.id = reh.entity_id
       JOIN circular_tracking ct ON ct.circular_id = c.id
       WHERE reh.rule_id = ? AND reh.event_name = 'CIRCULAR_PUBLISHED'
         AND reh.action_name = ? AND reh.status = 'STARTED'
         AND c.status = 'APPROVED' AND ct.is_seen = FALSE
         AND ct.employee_id <> c.creator_employee_id
         AND ((ct.last_reminder_at IS NULL
           AND DATE_ADD(c.published_at, INTERVAL ${Number(rule.reminder_frequency_value)} ${interval}) <= NOW())
           OR (ct.last_reminder_at IS NOT NULL
           AND DATE_ADD(ct.last_reminder_at, INTERVAL ${Number(rule.reminder_frequency_value)} ${interval}) <= NOW()))`,
      [rule.id, REMINDER_ACTION]
    );

    const dueCircularIds = [...new Set(dueRows.map(row => row.circular_id))];
    for (const row of dueRows) {
      const message = `Reminder: You have not read Circular ${row.circular_code || row.circular_id} (${row.title}). Please read the circular.`;
      const notificationId = await notificationModel.createNotification({
        circular_id: row.circular_id,
        recipient_employee_id: row.employee_id,
        sender_employee_id: row.creator_employee_id,
        notification_type: 'message',
        message_preview: message,
      });
      if (io) io.to(`notifications-${row.employee_id}`).emit('new-notification', {
        notification_id: notificationId, circular_id: row.circular_id,
        notification_type: 'message', message_preview: message,
        circular_title: row.title, circular_code: row.circular_code,
      });
      await db.query('UPDATE circular_tracking SET last_reminder_at = NOW() WHERE track_id = ?', [row.track_id]);
      remindersSent += 1;
    }

    if (rule.notify_creator) {
      for (const circularId of dueCircularIds) {
        const [unread] = await db.query(
          `SELECT c.creator_employee_id, c.title, c.circular_code,
                  CONCAT_WS(' ', e.first_name, e.middle_name, e.last_name) AS employee_name
           FROM circulars c
           JOIN circular_tracking ct ON ct.circular_id = c.id
           JOIN employees e ON e.id = ct.employee_id
           WHERE c.id = ? AND ct.is_seen = FALSE AND ct.employee_id <> c.creator_employee_id
           ORDER BY e.first_name, e.last_name`, [circularId]
        );
        if (!unread.length) continue;
        const circular = unread[0];
        const message = `Circular ${circular.circular_code || circularId} Read Status: The following employees have not read the circular: ${unread.map(row => row.employee_name).join(', ')}.`;
        const notificationId = await notificationModel.createNotification({
          circular_id: circularId, recipient_employee_id: circular.creator_employee_id,
          sender_employee_id: circular.creator_employee_id, notification_type: 'message', message_preview: message,
        });
        if (io) io.to(`notifications-${circular.creator_employee_id}`).emit('new-notification', {
          notification_id: notificationId, circular_id: circularId, notification_type: 'message', message_preview: message,
          circular_title: circular.title, circular_code: circular.circular_code,
        });
        creatorUpdates += 1;
      }
    }
  }
  return { remindersSent, creatorUpdates };
};
