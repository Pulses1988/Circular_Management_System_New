const db = require("../config/db");

exports.createRecurrenceLog = async (recurrenceData) => {
  const { circular_id, cycle_number, cycle_start_date, cycle_end_date } = recurrenceData;
  
  const [result] = await db.query(
    `INSERT INTO circular_recurrence_log (circular_id, cycle_number, cycle_start_date, cycle_end_date, status)
     VALUES (?, ?, ?, ?, 'ACTIVE')`,
    [circular_id, cycle_number, cycle_start_date, cycle_end_date]
  );
  
  return result.insertId;
};

exports.completeCurrentCycle = async (circular_id, cycle_number) => {
  await db.query(
    `UPDATE circular_recurrence_log 
     SET status = 'COMPLETED', completed_at = NOW()
     WHERE circular_id = ? AND cycle_number = ?`,
    [circular_id, cycle_number]
  );
};

exports.getActiveRecurrences = async () => {
  const [rows] = await db.query(
    `SELECT 
      crl.*,
      c.title,
      c.repeat_cycle_id,
      rc.duration_days
    FROM circular_recurrence_log crl
    JOIN circulars c ON crl.circular_id = c.id
    JOIN repeat_cycles rc ON c.repeat_cycle_id = rc.id
    WHERE crl.status = 'ACTIVE' 
      AND crl.cycle_end_date < CURDATE()`
  );
  
  return rows;
};

exports.getRecurrenceHistory = async (circular_id) => {
  const [rows] = await db.query(
    `SELECT 
      crl.*,
      cc.reference_number,
      cc.submission_mode,
      cc.completion_notes,
      CONCAT(e.first_name, ' ', e.last_name) AS completed_by_name
    FROM circular_recurrence_log crl
    LEFT JOIN circular_completions cc 
      ON crl.circular_id = cc.circular_id 
      AND crl.cycle_number = cc.cycle_number
    LEFT JOIN employees e ON cc.completed_by_employee_id = e.id
    WHERE crl.circular_id = ?
    ORDER BY crl.cycle_number DESC`,
    [circular_id]
  );
  
  return rows;
};