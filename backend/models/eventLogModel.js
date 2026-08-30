const db = require("../config/db");

exports.createEvent = (data) => {
  return db.query(
    `
    INSERT INTO event_master
    (
      event_name,
      entity_type,
      entity_id,
      triggered_by,
      description
    )
    VALUES (?,?,?,?,?)
    `,
    [
      data.event_name,
      data.entity_type,
      data.entity_id,
      data.triggered_by,
      data.description,
    ]
  );
};  


exports.getAllEvents = () => {
    return db.query(`
        SELECT
            *
        FROM
            event_master
        ORDER BY
            created_at DESC
    `);
};