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

// exports.getUnseenByEmployee = async (employeeId) => {
//   const sql = `
//     SELECT ct.*, c.title, c.effective_from, c.published_at
//     FROM circular_tracking ct
//     JOIN circulars c ON ct.circular_id = c.id
//     WHERE ct.employee_id = ? AND ct.is_seen = FALSE AND c.status = 'APPROVED'
//     ORDER BY c.published_at DESC
//   `;
//   return db.query(sql, [employeeId]);
// };
exports.getUnseenByEmployee = async (employeeId) => {
  const sql = `
    SELECT 
      ct.*,
      c.title,
        c.priority,
      c.effective_from,
      c.published_at,

      CASE
        WHEN EXISTS (
          SELECT 1
          FROM circular_approvals ca
          WHERE ca.circular_id = c.id
        )
        THEN 'CIRCULAR'
        ELSE 'HO_ASSIGNMENT'
      END AS item_type

    FROM circular_tracking ct

    JOIN circulars c
      ON ct.circular_id = c.id

    WHERE
      ct.employee_id = ?
      AND ct.is_seen = FALSE
      AND c.status = 'APPROVED'

    ORDER BY c.published_at DESC
  `;

  return db.query(sql, [employeeId]);
};







exports.getSeenByEmployee=async(employeeId)=>{
  const sql = `
    SELECT
      ct.circular_id,
      ct.employee_id,
      ct.is_seen,
      ct.seen_at,
      c.circular_code,
      c.title,
      c.priority,
      c.published_at,
      c.effective_from,

      CONCAT(
        e.first_name, ' ',
        IFNULL(e.middle_name, ''), ' ',
        e.last_name
      ) AS created_by

    FROM circular_tracking ct

    JOIN circulars c
      ON ct.circular_id = c.id

    JOIN employees e
      ON c.creator_employee_id = e.id

    WHERE
      ct.employee_id = ?
      AND ct.is_seen = TRUE
      AND c.status = 'APPROVED'

    ORDER BY ct.seen_at DESC
  
  
  `;
  return db.query(sql, [employeeId]);

};

exports.getCompletionStatus = async (circularId, employeeId) => {
  const sql = `
    SELECT is_completed, completed_at
    FROM circular_tracking
    WHERE circular_id = ? AND employee_id = ?
  `;
  return db.query(sql, [circularId, employeeId]);
};  


exports.getStatistics = async (employeeId) => {

  const sql = `
    SELECT

      COUNT(*) AS totalCirculars,

      SUM(CASE WHEN ct.is_seen = TRUE THEN 1 ELSE 0 END) AS readCirculars,

      SUM(CASE WHEN ct.is_seen = FALSE THEN 1 ELSE 0 END) AS unreadCirculars,

      SUM(CASE WHEN ct.is_completed = TRUE THEN 1 ELSE 0 END) AS completedCirculars

    FROM circular_tracking ct

    JOIN circulars c
      ON ct.circular_id = c.id

    WHERE
      ct.employee_id = ?
      AND c.status = 'APPROVED'
  `;

  return db.query(sql, [employeeId]);

}; 

exports.getPendingEmployeesForReminder = async () => {
  const sql = `
    SELECT
      ct.track_id,
      ct.circular_id,
      ct.employee_id,
      ct.last_reminder_at,

      c.title,
      c.circular_code,
      c.creator_employee_id,
      c.effective_from,

      rc.duration_days,
      rc.name AS repeat_cycle_name

    FROM circular_tracking ct

    JOIN circulars c
      ON ct.circular_id = c.id

    JOIN repeat_cycles rc
      ON c.repeat_cycle_id = rc.id

    WHERE
      ct.is_completed = FALSE
      AND c.status = 'APPROVED'
      AND (
        ct.last_reminder_at IS NULL
        OR DATE_ADD(
          ct.last_reminder_at,
          INTERVAL rc.duration_days DAY
        ) <= NOW()
      )
  `;

  const [rows] = await db.query(sql);
  return rows;
};   



exports.updateLastReminderAt = async (trackId) => {
  const sql = `
    UPDATE circular_tracking
    SET last_reminder_at = NOW()
    WHERE track_id = ?
  `;

  await db.query(sql, [trackId]);
};


exports.getCircularCompletionSummary = async (circularId) => {

  const sql = `
    SELECT
      COUNT(*) AS totalEmployees,
      SUM(CASE WHEN is_completed = TRUE THEN 1 ELSE 0 END) AS completedEmployees
    FROM circular_tracking
    WHERE circular_id = ?
  `;

  return db.query(sql, [circularId]);

};

// Assigned employees and their current completion state.  Completion-status
// notification rules use this without changing the tracking workflow.
// exports.getCompletionStatusEmployees = async (circularId) => {
//   const sql = `
//     SELECT
//       ct.employee_id,
//       ct.is_completed,
//       CONCAT_WS(' ', e.first_name, NULLIF(e.middle_name, ''), e.last_name) AS employee_name
//     FROM circular_tracking ct
//     JOIN employees e ON e.id = ct.employee_id
//     WHERE ct.circular_id = ?
//     ORDER BY e.first_name, e.last_name
//   `;

//   return db.query(sql, [circularId]);
// };

// Get assigned employees with read and completion status
exports.getCompletionStatusEmployees = async (circularId) => {
  const sql = `
    SELECT
      ct.employee_id,
      e.employee_id AS employee_code,

      ct.is_seen,
      ct.seen_at,

      ct.is_completed,
      ct.completed_at,

      CONCAT_WS(
        ' ',
        e.first_name,
        NULLIF(e.middle_name, ''),
        e.last_name
      ) AS employee_name

    FROM circular_tracking ct

    JOIN employees e
      ON e.id = ct.employee_id

    WHERE ct.circular_id = ?

    ORDER BY e.first_name, e.last_name
  `;

  return db.query(sql, [circularId]);
};
//pending summary//

exports.getPendingEmployees = async (circularId) => {

  const sql = `
    SELECT
      e.id,
      CONCAT(
        e.first_name,
        ' ',
        IFNULL(e.middle_name, ''),
        ' ',
        e.last_name
      ) AS employee_name
    FROM circular_tracking ct
    JOIN employees e
      ON ct.employee_id = e.id
    WHERE
      ct.circular_id = ?
      AND ct.is_completed = FALSE
  `;

  return db.query(sql, [circularId]);
};


//method for circular tracking 
// Get total employees who have read a circular
exports.getReadCount = async (circularId) => {
  const sql = `
    SELECT COUNT(*) AS readEmployees
    FROM circular_tracking
    WHERE circular_id = ?
      AND is_seen = TRUE
  `;

  return db.query(sql, [circularId]);
};