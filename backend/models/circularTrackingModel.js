const db = require("../config/db");
exports.bulkInsert = async (trackingData) => {
  if (!Array.isArray(trackingData) || trackingData.length === 0) return;

  const sql = `
    INSERT INTO circular_tracking 
      (circular_id, employee_id, is_seen, seen_at, is_completed, completed_at)
    VALUES ?
  `;

  const values = trackingData.map(td => [
    td.circular_id,
    td.employee_id,
    td.is_seen,
    td.seen_at,
    td.is_completed,
    td.completed_at
  ]);

  return db.query(sql, [values]);
};

exports.markAsSeen = async (circularId, employeeId) => {
  const sql = `
    UPDATE circular_tracking
    SET is_seen = TRUE, seen_at = NOW()
    WHERE circular_id = ? 
      AND employee_id = ? 
      AND (is_seen = FALSE OR seen_at IS NULL)
  `;
  return db.query(sql, [circularId, employeeId]);
};

exports.markAsCompleted = async (circularId, employeeId) => {
  const sql = `
    UPDATE circular_tracking
    SET is_completed = TRUE, completed_at = NOW()
    WHERE circular_id = ? AND employee_id = ?
  `;
  return db.query(sql, [circularId, employeeId]);
};

exports.getUnseenByEmployee = async (employeeId) => {
  const sql = `
    SELECT ct.*, c.title, c.effective_from, c.published_at
    FROM circular_tracking ct
    JOIN circulars c ON ct.circular_id = c.id
    WHERE ct.employee_id = ? AND ct.is_seen = FALSE AND c.status = 'APPROVED'
    ORDER BY c.published_at DESC
  `;
  return db.query(sql, [employeeId]);
};

exports.getSeenByEmployee=async(employeeId)=>{
  const sql = `
    SELECT ct.*, c.title, c.effective_from, c.published_at
    FROM circular_tracking ct
    JOIN circulars c ON ct.circular_id = c.id
    WHERE ct.employee_id = ? AND ct.is_seen = TRUE AND c.status = 'APPROVED'
    ORDER BY c.published_at DESC
  `;
  return db.query(sql, [employeeId]);

}

exports.getCompletionStatus = async (circularId, employeeId) => {
  const sql = `
    SELECT is_completed, completed_at
    FROM circular_tracking
    WHERE circular_id = ? AND employee_id = ?
  `;
  return db.query(sql, [circularId, employeeId]);
};