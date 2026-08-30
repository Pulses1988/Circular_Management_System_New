const db = require("../config/db");

/**
 * Create Rule
 */
exports.createRule = (data) => {
  const {
    rule_name,
    event_name,
    action_name,
    condition_field,
    condition_operator,
    condition_value,
    status,
    created_by,
    reminder_frequency_value,
    reminder_frequency_unit,
    notify_creator,
  } = data;

  return db.query(
    `
    INSERT INTO rule_master
    (
      rule_name,
      event_name,
      action_name,
      condition_field,
      condition_operator,
      condition_value,
      status,
      created_by,
      reminder_frequency_value,
      reminder_frequency_unit,
      notify_creator
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      rule_name,
      event_name,
      action_name,
      condition_field,
      condition_operator,
      condition_value,
      status,
      created_by,
      reminder_frequency_value,
      reminder_frequency_unit,
      notify_creator,
    ]
  );
};

/**
 * Create Rule Target
 */
exports.createRuleTarget = (data) => {
  const {
    rule_id,
    target_type,
    target_id,
  } = data;

  return db.query(
    `
    INSERT INTO rule_targets
    (
      rule_id,
      target_type,
      target_id
    )
    VALUES (?, ?, ?)
    `,
    [
      rule_id,
      target_type,
      target_id,
    ]
  );
};

/**
 * Get All Rules
 */
exports.getAllRules = () => {
  return db.query(
    `
    SELECT
        rm.id,
        rm.rule_name,
        rm.event_name,
        rm.action_name,
        rm.condition_field,
        rm.condition_operator,
        rm.condition_value,
        rm.status,
        rm.reminder_frequency_value,
        rm.reminder_frequency_unit,
        rm.notify_creator,
        rm.created_at,

        rt.target_type,
        rt.target_id

    FROM rule_master rm

    LEFT JOIN rule_targets rt
           ON rm.id = rt.rule_id

    ORDER BY rm.created_at DESC
    `
  );
};

/**
 * Get Rule By Id
 */
exports.getRuleById = (id) => {
  return db.query(
    `
    SELECT

        rm.*,

        rt.target_type,
        rt.target_id

    FROM rule_master rm

    LEFT JOIN rule_targets rt
           ON rm.id = rt.rule_id

    WHERE rm.id = ?
    `,
    [id]
  );
};

/**
 * Update Rule
 */
exports.updateRule = (id, data) => {

  const {
    rule_name,
    event_name,
    action_name,
    condition_field,
    condition_operator,
    condition_value,
    status,
    reminder_frequency_value,
    reminder_frequency_unit,
    notify_creator,
  } = data;

  return db.query(
    `
    UPDATE rule_master

    SET

        rule_name=?,
        event_name=?,
        action_name=?,
        condition_field=?,
        condition_operator=?,
        condition_value=?,
        status=?,
        reminder_frequency_value=?,
        reminder_frequency_unit=?,
        notify_creator=?

    WHERE id=?
    `,
    [
      rule_name,
      event_name,
      action_name,
      condition_field,
      condition_operator,
      condition_value,
      status,
      reminder_frequency_value,
      reminder_frequency_unit,
      notify_creator,
      id,
    ]
  );
};

/**
 * Update Rule Target
 */
exports.updateRuleTarget = (
  ruleId,
  targetType,
  targetId
) => {

  return db.query(
    `
    UPDATE rule_targets

    SET

      target_type=?,
      target_id=?

    WHERE rule_id=?
    `,
    [
      targetType,
      targetId,
      ruleId,
    ]
  );
};

/**
 * Delete Rule Target
 */
exports.deleteRuleTarget = (ruleId) => {

  return db.query(
    `
    DELETE FROM rule_targets
    WHERE rule_id=?
    `,
    [ruleId]
  );
};

/**
 * Delete Rule
 */
exports.deleteRule = (id) => {

  return db.query(
    `
    DELETE FROM rule_master
    WHERE id=?
    `,
    [id]
  );
};

/**
 * Get Active Rules By Event
 * (This will be used later by the Rule Engine Service)
 */
exports.getActiveRulesByEvent = (eventName) => {

  return db.query(
    `
    SELECT

        rm.*,

        rt.target_type,
        rt.target_id

    FROM rule_master rm

    INNER JOIN rule_targets rt

        ON rm.id=rt.rule_id

    WHERE

        rm.status='ACTIVE'

    AND

        rm.event_name=?
    `,
    [eventName]
  );

};

exports.setRuleStatus = (id, status) => db.query(
  'UPDATE rule_master SET status = ? WHERE id = ?', [status, id]
);
