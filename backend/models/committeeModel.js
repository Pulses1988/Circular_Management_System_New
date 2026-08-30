const db = require("../config/db");

/**
 * Create Committee
 */
exports.createCommittee = (data) => {
  const { committee_name, description, status } = data;

  return db.execute(
    `INSERT INTO committees
    (committee_name, description, status)
    VALUES (?, ?, ?)`,
    [
      committee_name,
      description,
      status || "ACTIVE",
    ]
  );
};

/**
 * Create a committee and its allowed member types together.
 */
exports.createCommitteeWithMemberTypes = async (data, memberTypeIds) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      `INSERT INTO committees
      (committee_name, description, status)
      VALUES (?, ?, ?)`,
      [data.committee_name, data.description, data.status || "ACTIVE"]
    );

    await replaceCommitteeMemberTypes(connection, result.insertId, memberTypeIds);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Get All Committees
 */
exports.getAllCommittees = () => {
  return db.execute(`
    SELECT *
    FROM committees
    ORDER BY id DESC
  `);
};

/**
 * Get Committee By ID
 */
exports.getCommitteeById = (id) => {
  return db.execute(
    `
    SELECT *
    FROM committees
    WHERE id = ?
    `,
    [id]
  );
};

/**
 * Update Committee
 */
exports.updateCommittee = (id, data) => {
  const { committee_name, description, status } = data;

  return db.execute(
    `
    UPDATE committees
    SET
      committee_name = ?,
      description = ?,
      status = ?
    WHERE id = ?
    `,
    [
      committee_name,
      description,
      status,
      id,
    ]
  );
};

/**
 * Update a committee and replace its allowed member types together.
 */
exports.updateCommitteeWithMemberTypes = async (id, data, memberTypeIds) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      `UPDATE committees
       SET committee_name = ?, description = ?, status = ?
       WHERE id = ?`,
      [data.committee_name, data.description, data.status, id]
    );
    await replaceCommitteeMemberTypes(connection, id, memberTypeIds);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

exports.getCommitteeMemberTypeIds = (committeeId) => {
  return db.execute(
    `SELECT member_type_id
     FROM committee_member_types
     WHERE committee_id = ?
     ORDER BY member_type_id ASC`,
    [committeeId]
  );
};

/**
 * Get employees whose role matches one of the committee's allowed member types.
 */ 


// exports.getEligibleCommitteeEmployees = (committeeId) => {
//   return db.execute(
//     `
//     SELECT DISTINCT
//       e.id,
//       e.employee_id,
//       e.first_name,
//       e.middle_name,
//       e.last_name,
//       e.phone_no,
//       e.email,
//       e.role_id,
//       r.name AS role_name
//     FROM committee_member_types cmt
//     INNER JOIN member_types mt
//       ON mt.id = cmt.member_type_id
//     INNER JOIN roles r
//       ON LOWER(TRIM(r.name)) = LOWER(TRIM(mt.member_type_name))
//     INNER JOIN employees e
//       ON e.role_id = r.id
//     WHERE cmt.committee_id = ?
//       AND mt.status = 'ACTIVE'
//     ORDER BY e.first_name ASC, e.last_name ASC
//     `,
//     [committeeId]
//   );
// }; 


//new query to get eligible employees for commitee  

exports.getEligibleCommitteeEmployees = (committeeId) => {
  return db.execute(
    `
    SELECT DISTINCT
      e.id,
      e.employee_id,
      e.first_name,
      e.middle_name,
      e.last_name,
      e.phone_no,
      e.email,
      e.role_id,
      r.name AS role_name
    FROM committee_member_types cmt
    INNER JOIN member_types mt
      ON mt.id = cmt.member_type_id
    INNER JOIN employees e
      ON e.role_id = e.role_id
    INNER JOIN roles r
      ON r.id = e.role_id
    WHERE cmt.committee_id = ?
      AND mt.status = 'ACTIVE'
      AND (
        LOWER(TRIM(mt.member_type_name)) = LOWER(TRIM(r.name))

        OR

        (
          LOWER(TRIM(mt.member_type_name)) = 'employee'
          AND LOWER(TRIM(r.name)) NOT IN (
            'ceo',
            'chairman',
            'director',
            'managing director'
          )
        )
      )
    ORDER BY e.first_name ASC, e.last_name ASC
    `,
    [committeeId]
  );
};




/**
 * Delete Committee
 */
exports.deleteCommittee = async (id) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    await connection.execute(
      `DELETE FROM committee_member_types WHERE committee_id = ?`,
      [id]
    );
    const [result] = await connection.execute(
      `DELETE FROM committees WHERE id = ?`,
      [id]
    );
    await connection.commit();
    return [result];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

async function replaceCommitteeMemberTypes(connection, committeeId, memberTypeIds) {
  await connection.execute(
    `DELETE FROM committee_member_types WHERE committee_id = ?`,
    [committeeId]
  );

  for (const memberTypeId of memberTypeIds) {
    await connection.execute(
      `INSERT INTO committee_member_types (committee_id, member_type_id)
       VALUES (?, ?)`,
      [committeeId, memberTypeId]
    );
  }
}

/**
 * ================================
 * COMMITTEE MEMBER OPERATIONS
 * ================================
 */

/**
 * Add Employee to Committee
 */
exports.addCommitteeMember = (committee_id, employee_id) => {
  return db.execute(
    `
    INSERT INTO committee_members
    (committee_id, employee_id)
    VALUES (?, ?)
    `,
    [committee_id, employee_id]
  );
};

/**
 * Get Members of Committee
 */
// exports.getCommitteeMembers = (committee_id) => {
//   return db.execute(
//     `
//     SELECT
//       cm.id,
//       e.id,
//       e.employee_id,
//       CONCAT(
//         e.first_name,
//         ' ',
//         IFNULL(e.middle_name, ''),
//         ' ',
//         IFNULL(e.last_name, '')
//       ) AS employee_name,
//       e.email,
//       e.phone_no
//     FROM committee_members cm
//     INNER JOIN employees e
//       ON cm.employee_id = e.id
//     WHERE cm.committee_id = ?
//     ORDER BY e.first_name ASC
//     `,
//     [committee_id]
//   );
// };
exports.getCommitteeMembers = (committee_id) => {
  return db.execute(
    `
    SELECT
      cm.id,
      e.id AS employee_db_id,
      e.employee_id,
      e.first_name,
      e.middle_name,
      e.last_name,
      e.phone_no,
      e.email,
      e.role_id,
      e.department_id,
      e.branch_id,
      e.head_office_id,
      e.can_create_circular,
      e.can_approve_circular,
      e.created_at
    FROM committee_members cm
    INNER JOIN employees e
      ON cm.employee_id = e.id
    WHERE cm.committee_id = ?
    ORDER BY e.first_name ASC
    `,
    [committee_id]
  );
};




/**
 * Remove Member From Committee
 */
exports.removeCommitteeMember = (id) => {
  return db.execute(
    `
    DELETE FROM committee_members
    WHERE id = ?
    `,
    [id]
  );
};

/**
 * Get Committees of Employee
 */
exports.getEmployeeCommittees = (employee_id) => {
  return db.execute(
    `
    SELECT
      c.id,
      c.committee_name
    FROM committees c
    INNER JOIN committee_members cm
      ON c.id = cm.committee_id
    WHERE cm.employee_id = ?
    `,
    [employee_id]
  );
};   


//Add commitee member 

/**
 * Check if employee already exists in committee
 */
exports.checkCommitteeMember = (committee_id, employee_id) => {
  return db.execute(
    `
    SELECT *
    FROM committee_members
    WHERE committee_id = ?
      AND employee_id = ?
    `,
    [committee_id, employee_id]
  );
};

/**
 * Add one or more eligible employees to a committee. Existing assignments are
 * left untouched so this operation is safe to repeat.
 */
exports.addCommitteeMembers = async (committeeId, employeeIds) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const placeholders = employeeIds.map(() => "?").join(", ");
    // const [eligibleEmployees] = await connection.execute(
    //   `SELECT DISTINCT e.id
    //    FROM committee_member_types cmt
    //    INNER JOIN member_types mt ON mt.id = cmt.member_type_id
    //    INNER JOIN roles r ON LOWER(TRIM(r.name)) = LOWER(TRIM(mt.member_type_name))
    //    INNER JOIN employees e ON e.role_id = r.id
    //    WHERE cmt.committee_id = ?
    //      AND mt.status = 'ACTIVE'
    //      AND e.id IN (${placeholders})`,
    //   [committeeId, ...employeeIds]
    // ); 


const [eligibleEmployees] = await connection.execute(
  `SELECT DISTINCT e.id
   FROM committee_member_types cmt
   INNER JOIN member_types mt
     ON mt.id = cmt.member_type_id
   INNER JOIN employees e
     ON e.role_id = e.role_id
   INNER JOIN roles r
     ON r.id = e.role_id
   WHERE cmt.committee_id = ?
     AND mt.status = 'ACTIVE'
     AND e.id IN (${placeholders})
     AND (
          LOWER(TRIM(mt.member_type_name)) = LOWER(TRIM(r.name))

          OR

          (
            LOWER(TRIM(mt.member_type_name)) = 'employee'
            AND LOWER(TRIM(r.name)) NOT IN
            (
              'ceo',
              'chairman',
              'director',
              'managing director'
            )
          )
     )`,
  [committeeId, ...employeeIds]
);




    if (eligibleEmployees.length !== employeeIds.length) {
      const error = new Error("One or more employees are not eligible for this committee");
      error.statusCode = 400;
      throw error;
    }

    let assignedCount = 0;
    for (const employeeId of employeeIds) {
      const [existingMembers] = await connection.execute(
        `SELECT id FROM committee_members
         WHERE committee_id = ? AND employee_id = ?`,
        [committeeId, employeeId]
      );

      if (existingMembers.length === 0) {
        await connection.execute(
          `INSERT INTO committee_members (committee_id, employee_id)
           VALUES (?, ?)`,
          [committeeId, employeeId]
        );
        assignedCount += 1;
      }
    }

    await connection.commit();
    return assignedCount;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
