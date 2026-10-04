const db = require("../config/db");

// Create HO Assignment
exports.createHOAssignment = (data) => {
  const {
    assignment_code,
    title,
    description,
    priority,
    due_date,
    created_by,
    status,
  } = data;

  return db.query(
    `
    INSERT INTO ho_assignments
    (
      assignment_code,
      title,
      description,
      priority,
      due_date,
      created_by,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      assignment_code,
      title,
      description,
      priority,
      due_date,
      created_by,
      status,
    ]
  );
};


// Get all HO Assignments
exports.getAllHOAssignments = () => {
  return db.query(
    `
    SELECT
      ha.*,
      CONCAT(
        e.first_name,
        ' ',
        e.last_name
      ) AS creator_name
    FROM ho_assignments ha
    LEFT JOIN employees e
      ON ha.created_by = e.id
    ORDER BY ha.created_at DESC
    `
  );
};


// Get HO Assignment by ID
exports.getHOAssignmentById = (id) => {
  return db.query(
    `
    SELECT
      ha.*,
      CONCAT(
        e.first_name,
        ' ',
        e.last_name
      ) AS creator_name
    FROM ho_assignments ha
    LEFT JOIN employees e
      ON ha.created_by = e.id
    WHERE ha.id = ?
    `,
    [id]
  );
};


// Create tracking entries for employees
exports.createTrackingEntries = async (assignmentId, employeeIds) => {
  if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
    return;
  }

  const values = employeeIds.map((employeeId) => [
    assignmentId,
    employeeId,
    false,
    null,
    false,
    null,
  ]);

  await db.query(
    `
    INSERT INTO ho_assignment_tracking
    (
      assignment_id,
      employee_id,
      is_seen,
      seen_at,
      is_completed,
      completed_at
    )
    VALUES ?
    `,
    [values]
  );
};


// Get HO Assignments assigned to an employee
exports.getAssignmentsByEmployeeId = (employeeId) => {
  return db.query(
    `
    SELECT
      ha.id AS assignment_id,
      ha.assignment_code,
      ha.title,
      ha.description,
      ha.priority,
      ha.due_date,
      ha.created_by,
      ha.status,
      ha.created_at,
      ha.updated_at,

      hat.tracking_id,
      hat.is_seen,
      hat.seen_at,
      hat.is_completed,
      hat.completed_at,

      CONCAT(
        e.first_name,
        ' ',
        e.last_name
      ) AS creator_name

    FROM ho_assignment_tracking hat

    JOIN ho_assignments ha
      ON hat.assignment_id = ha.id

    LEFT JOIN employees e
      ON ha.created_by = e.id

    WHERE hat.employee_id = ?

    ORDER BY ha.created_at DESC
    `,
    [employeeId]
  );
};  


// Mark HO Assignment as read
exports.markAssignmentAsSeen = (assignmentId, employeeId) => {
  return db.query(
    `
    UPDATE ho_assignment_tracking
    SET
      is_seen = true,
      seen_at = NOW()
    WHERE
      assignment_id = ?
      AND employee_id = ?
      AND is_seen = false
    `,
    [assignmentId, employeeId]
  );
};