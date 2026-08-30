const db = require("../config/db");

exports.saveExecution = (data) => {

    return db.query(

        `INSERT INTO rule_execution_history
        (rule_id, event_name, rule_name, action_name, status, entity_id)
        VALUES (?, ?, ?, ?, ?, ?)`,

        [
            data.rule_id || null,
            data.event_name,
            data.rule_name,
            data.action_name,
            data.status,
            data.entity_id
        ]
    );

};

exports.getAllExecutions = () => {

    return db.query(

       `SELECT *
         FROM rule_execution_history
         ORDER BY executed_at DESC, id DESC`


    );

};

exports.hasSuccessfulExecution = (ruleId, eventName, actionName, entityId) => {
    return db.query(
        `SELECT id
         FROM rule_execution_history
         WHERE rule_id = ?
           AND event_name = ?
           AND action_name = ?
           AND entity_id = ?
           AND status = 'SUCCESS'
         LIMIT 1`,
        [ruleId, eventName, actionName, entityId]
    );
};
