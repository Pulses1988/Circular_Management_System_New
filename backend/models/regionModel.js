const db = require("../config/db");

// Get all Regions
exports.getAllRegions = () => {
  return db.query(`
    SELECT
      r.id,
      r.name,
      r.head_office_id,
      h.name AS head_office_name,
      r.created_at
    FROM regions r
    INNER JOIN head_office h
      ON r.head_office_id = h.id
    ORDER BY r.id DESC
  `);
};

// Get Region by ID
exports.getRegionById = (id) => {
  return db.query(
    "SELECT * FROM regions WHERE id = ?",
    [id]
  );
};

// Create Region
exports.createRegion = ({ name, head_office_id }) => {
  return db.query(
    `INSERT INTO regions (name, head_office_id)
     VALUES (?, ?)`,
    [name, head_office_id]
  );
};

// Delete Region
exports.deleteRegion = (id) => {
  return db.query(
    "DELETE FROM regions WHERE id = ?",
    [id]
  );
};

// Check duplicate Region
exports.checkRegionExists = (
  name,
  head_office_id,
  excludeId = null
) => {

  const trimmedName = name.trim();

  if (excludeId) {

    return db.query(
      `SELECT id
       FROM regions
       WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))
       AND head_office_id = ?
       AND id != ?`,
      [trimmedName, head_office_id, excludeId]
    );

  }

  return db.query(
    `SELECT id
     FROM regions
     WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))
     AND head_office_id = ?`,
    [trimmedName, head_office_id]
  );
};

//Update region 
exports.updateRegion = (id, data) => {
  return db.query(
    `
    UPDATE regions
    SET
      name = ?,
      head_office_id = ?
    WHERE id = ?
    `,
    [
      data.name,
      data.head_office_id,
      id
    ]
  );
};