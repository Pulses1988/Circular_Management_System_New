const db = require("../config/db");

// Get all Zones
exports.getAllZones = () => {
  return db.query(`
    SELECT
      z.id,
      z.name,
      z.region_id,
      r.name AS region_name,
      z.created_at
    FROM zones z
    INNER JOIN regions r
      ON z.region_id = r.id
    ORDER BY z.id DESC
  `);
};

// Get Zone by ID
exports.getZoneById = (id) => {
  return db.query(
    `
    SELECT
      z.id,
      z.name,
      z.region_id,
      r.name AS region_name,
      z.created_at
    FROM zones z
    INNER JOIN regions r
      ON z.region_id = r.id
    WHERE z.id = ?
    `,
    [id]
  );
};

// Create Zone
exports.createZone = ({ name, region_id }) => {
  return db.query(
    `
    INSERT INTO zones
    (name, region_id)
    VALUES (?, ?)
    `,
    [name, region_id]
  );
};

// Delete Zone
exports.deleteZone = (id) => {
  return db.query(
    "DELETE FROM zones WHERE id = ?",
    [id]
  );
};

// Check duplicate Zone name within the same Region
// exports.checkZoneExists = (name, region_id) => {
//   return db.query(
//     `
//     SELECT id
//     FROM zones
//     WHERE name = ?
//       AND region_id = ?
//     `,
//     [name, region_id]
//   );
// };   

exports.checkZoneExists = (
  name,
  region_id,
  excludeId = null
) => {

  if (excludeId) {

    return db.query(
      `
      SELECT id
      FROM zones
      WHERE name = ?
      AND region_id = ?
      AND id != ?
      `,
      [name, region_id, excludeId]
    );

  }

  return db.query(
    `
    SELECT id
    FROM zones
    WHERE name = ?
    AND region_id = ?
    `,
    [name, region_id]
  );

};





// Get Zones by Region
exports.getZonesByRegionId = (regionId) => {
  return db.query(
    `
    SELECT
      id,
      name,
      region_id
    FROM zones
    WHERE region_id = ?
    ORDER BY name
    `,
    [regionId]
  );
};    



//zone update 
exports.updateZone = (id, data) => {
  return db.query(
    `
    UPDATE zones
    SET
      name = ?,
      region_id = ?
    WHERE id = ?
    `,
    [
      data.name,
      data.region_id,
      id
    ]
  );
};