const db = require("../config/db");

/**
 * ==============================
 * Get All Member Types
 * ==============================
 */
exports.getAllMemberTypes = () => {
  return db.execute(`
    SELECT *
    FROM member_types
    ORDER BY member_type_name ASC
  `);
};

/**
 * ==============================
 * Get Active Member Types
 * ==============================
 */
exports.getActiveMemberTypes = () => {
  return db.execute(`
    SELECT *
    FROM member_types
    WHERE status = 'ACTIVE'
    ORDER BY member_type_name ASC
  `);
};

/**
 * ==============================
 * Get Member Type By ID
 * ==============================
 */
exports.getMemberTypeById = (id) => {
  return db.execute(
    `
    SELECT *
    FROM member_types
    WHERE id = ?
    `,
    [id]
  );
};

/**
 * ==============================
 * Create Member Type
 * ==============================
 */
exports.createMemberType = (data) => {
  const { member_type_name, status } = data;

  return db.execute(
    `
    INSERT INTO member_types
    (member_type_name, status)
    VALUES (?, ?)
    `,
    [
      member_type_name,
      status || "ACTIVE"
    ]
  );
};

/**
 * ==============================
 * Update Member Type
 * ==============================
 */
exports.updateMemberType = (id, data) => {
  const { member_type_name, status } = data;

  return db.execute(
    `
    UPDATE member_types
    SET
      member_type_name = ?,
      status = ?
    WHERE id = ?
    `,
    [
      member_type_name,
      status,
      id
    ]
  );
};

/**
 * ==============================
 * Delete Member Type
 * ==============================
 */
exports.deleteMemberType = (id) => {
  return db.execute(
    `
    DELETE FROM member_types
    WHERE id = ?
    `,
    [id]
  );
};