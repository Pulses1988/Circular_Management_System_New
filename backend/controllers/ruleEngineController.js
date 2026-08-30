const ruleEngineModel = require("../models/ruleEngineModel");

const REMINDER_RULE = {
  event_name: 'CIRCULAR_PUBLISHED',
  condition_field: 'HAS_UNREAD_EMPLOYEES',
  action_name: 'SEND_READ_REMINDER',
  target_type: 'UNREAD_ASSIGNED_EMPLOYEES',
};

// Event notification rules use the same rule_master and rule_targets records as
// the existing reminder.  Their action services resolve recipients directly
// from the circular, so they intentionally do not participate in the reminder
// scheduler.
const EVENT_NOTIFICATION_RULES = {
  CIRCULAR_CREATED: {
    condition_field: 'APPROVER_ASSIGNED',
    action_name: 'SEND_APPROVER_NOTIFICATION',
    target_type: 'ASSIGNED_APPROVERS',
  },
  CIRCULAR_REJECTED: {
    condition_field: 'CIRCULAR_REJECTED',
    action_name: 'SEND_CIRCULAR_REJECTION_NOTIFICATION',
    target_type: 'CIRCULAR_CREATOR',
  },
  EMPLOYEE_COMPLETED_CIRCULAR: {
    condition_field: 'ASSIGNED_EMPLOYEES_EXIST',
    action_name: 'SEND_COMPLETION_STATUS_NOTIFICATION',
    target_type: 'CIRCULAR_CREATOR',
  },
  ALL_EMPLOYEES_COMPLETED: {
    condition_field: 'ALL_ASSIGNED_EMPLOYEES_COMPLETED',
    action_name: 'SEND_ALL_EMPLOYEES_COMPLETED_NOTIFICATION',
    target_type: 'CIRCULAR_CREATOR',
  },
};

function normalizeReminderRule(body, createdBy) {
  const eventName = String(body.event_name || REMINDER_RULE.event_name).toUpperCase();
  const frequency = Number(body.reminder_frequency_value);
  const unit = String(body.reminder_frequency_unit || '').toUpperCase();

  if (!String(body.rule_name || '').trim()) {
    return { error: 'Rule name is required.' };
  }

  if (eventName === REMINDER_RULE.event_name) {
    if (!Number.isInteger(frequency) || frequency < 1 || !['MINUTE', 'HOUR', 'DAY'].includes(unit)) {
      return { error: 'Rule name and a positive frequency using MINUTE, HOUR, or DAY are required.' };
    }
    return {
      data: {
        rule_name: body.rule_name.trim(), ...REMINDER_RULE,
        condition_operator: null, condition_value: null,
        status: body.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
        created_by: createdBy, target_id: null,
        reminder_frequency_value: frequency, reminder_frequency_unit: unit,
        notify_creator: body.notify_creator === true || body.notify_creator === 1 || body.notify_creator === 'true',
      }
    };
  }

  const notificationRule = EVENT_NOTIFICATION_RULES[eventName];
  if (!notificationRule) {
    return { error: 'Unsupported rule event.' };
  }

  return {
    data: {
      rule_name: body.rule_name.trim(), event_name: eventName, ...notificationRule,
      condition_operator: null, condition_value: null,
      status: body.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
      created_by: createdBy, target_id: null,
      reminder_frequency_value: 1, reminder_frequency_unit: 'ONCE',
      notify_creator: false,
    }
  };
}

/**
 * Create Rule
 */
exports.createRule = async (req, res) => {
  try {
    const normalized = normalizeReminderRule(req.body, req.user.id);
    if (normalized.error) return res.status(400).json({ success: false, message: normalized.error });
    const data = normalized.data;

    // Insert into rule_master
    const [result] = await ruleEngineModel.createRule(data);

    const ruleId = result.insertId;

    // Insert into rule_targets
    await ruleEngineModel.createRuleTarget({
      rule_id: ruleId,
      target_type: data.target_type,
      target_id: data.target_id,
    });

    res.status(201).json({
      success: true,
      message: "Rule created successfully",
      rule_id: ruleId,
    });

  } catch (error) {
    console.error("Create Rule Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create rule",
      error: error.message,
    });
  }
};


/**
 * Get All Rules
 */
exports.getAllRules = async (req, res) => {

  try {

    const [rows] = await ruleEngineModel.getAllRules();

    res.status(200).json(rows);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch rules",
    });

  }

};


/**
 * Get Rule By Id
 */
exports.getRuleById = async (req, res) => {

  try {

    const { id } = req.params;

    const [rows] = await ruleEngineModel.getRuleById(id);

    if (rows.length === 0) {

      return res.status(404).json({
        success: false,
        message: "Rule not found",
      });

    }

    res.status(200).json(rows[0]);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch rule",
    });

  }

};


/**
 * Update Rule
 */
exports.updateRule = async (req, res) => {

  try {

    const { id } = req.params;

    const normalized = normalizeReminderRule(req.body, undefined);
    if (normalized.error) return res.status(400).json({ success: false, message: normalized.error });
    const data = normalized.data;

    const [result] = await ruleEngineModel.updateRule(id, data);

    if (result.affectedRows === 0) {

      return res.status(404).json({
        success: false,
        message: "Rule not found",
      });

    }

    await ruleEngineModel.updateRuleTarget(
      id,
      data.target_type,
      data.target_id
    );

    res.status(200).json({
      success: true,
      message: "Rule updated successfully",
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to update rule",
    });

  }

};


/**
 * Delete Rule
 */
exports.deleteRule = async (req, res) => {

  try {

    const { id } = req.params;

    await ruleEngineModel.deleteRuleTarget(id);

    const [result] = await ruleEngineModel.deleteRule(id);

    if (result.affectedRows === 0) {

      return res.status(404).json({
        success: false,
        message: "Rule not found",
      });

    }

    res.status(200).json({
      success: true,
      message: "Rule deleted successfully",
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to delete rule",
    });

  }

};

exports.setRuleStatus = async (req, res) => {
  const status = req.body.status === 'ACTIVE' ? 'ACTIVE' : req.body.status === 'INACTIVE' ? 'INACTIVE' : null;
  if (!status) return res.status(400).json({ success: false, message: 'Status must be ACTIVE or INACTIVE.' });
  const [result] = await ruleEngineModel.setRuleStatus(req.params.id, status);
  if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Rule not found' });
  res.json({ success: true, message: `Rule ${status.toLowerCase()}`, status });
};
