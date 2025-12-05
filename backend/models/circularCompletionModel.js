const db = require("../config/db");

exports.createCompletion = async (completionData) => {
  const { circular_id, completed_by_employee_id, reference_number, submission_mode, completion_notes } = completionData;
  
  const [result] = await db.query(
    `INSERT INTO circular_completions (circular_id, completed_by_employee_id, reference_number, submission_mode, completion_notes)
     VALUES (?, ?, ?, ?, ?)`,
    [circular_id, completed_by_employee_id, reference_number, submission_mode, completion_notes || null]
  );
  
  return result.insertId;
};

exports.getCompletionByCircular = async (circular_id) => {
  const [rows] = await db.query(
    `SELECT 
      cc.*,
      CONCAT(e.first_name, ' ', e.last_name) AS completed_by_name,
      e.email AS completed_by_email
    FROM circular_completions cc
    JOIN employees e ON cc.completed_by_employee_id = e.id
    WHERE cc.circular_id = ?
    ORDER BY cc.completed_at DESC`,
    [circular_id]
  );
  
  return rows;
};

exports.getCompletionById = async (completion_id) => {
  const [rows] = await db.query(
    `SELECT * FROM circular_completions WHERE completion_id = ?`,
    [completion_id]
  );
  
  return rows[0];
};