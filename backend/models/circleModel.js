const db = require("../config/db");



exports.createCircle = async(data, callback)=>{


    try{


        console.log("========== CREATE CIRCLE MODEL HIT ==========");

        console.log("MODEL DATA:",data);



        const sql = `

            INSERT INTO circle_table
            (
                zone_id,
                circle_name,
                circle_code
            )

            VALUES(?,?,?)

        `;



        const [result] = await db.query(

            sql,

            [
                data.zone_id,
                data.circle_name,
                data.circle_code
            ]

        );



        console.log("INSERT RESULT FROM DB:",result);



        callback(null,result);



    }
    catch(err){


        console.log("MODEL ERROR:",err);


        callback(err,null);


    }


};  


//getAllCircles
// getAllCircles
// exports.getAllCircles = async (callback) => {
//   try {

//     const sql = `
//       SELECT 
//         c.circle_id,
//         c.circle_name,
//         c.circle_code,
//         c.zone_id,
//         z.name AS zone_name,
//         c.created_at
//       FROM circle_table c
//       JOIN zones z
//         ON c.zone_id = z.id
//       ORDER BY c.circle_name
//     `;

//     const [rows] = await db.query(sql);

//     callback(null, rows);

//   } catch (err) {
//     callback(err, null);
//   }
// };
// Get all Circles
exports.getAllCircles = async (callback) => {
  try {

    const sql = `
      SELECT  
        c.circle_id,
        c.circle_name,
        c.circle_code,
        c.zone_id,
        z.name AS zone_name,
        c.created_at,

        CASE
          WHEN EXISTS (
            SELECT 1
            FROM branches b
            WHERE b.circle_id = c.circle_id
          )
          OR EXISTS (
            SELECT 1
            FROM departments d
            INNER JOIN branches b
              ON d.branch_id = b.id
            WHERE b.circle_id = c.circle_id
          )
          THEN 1
          ELSE 0
        END AS has_branch_or_department

      FROM circle_table c

      JOIN zones z
        ON c.zone_id = z.id

      ORDER BY c.circle_name
    `;

    const [rows] = await db.query(sql);

    callback(null, rows);

  } catch (err) {

    console.log("GET ALL CIRCLES MODEL ERROR:", err);

    callback(err, null);

  }
};
//getcircles //

exports.getCirclesByZone = async (zoneId, callback) => {

  try {

    const sql = `
      SELECT
        circle_id,
        circle_name,
        circle_code,
        zone_id
      FROM circle_table
      WHERE zone_id = ?
      ORDER BY circle_name
    `;

    const [rows] = await db.query(sql, [zoneId]);

    callback(null, rows);

  } catch (err) {

    callback(err, null);

  }

}; 

// Check whether Circle has Branch or Department
exports.checkCircleDependencies = async (circleId, callback) => {
  try {

    const sql = `
      SELECT
        COUNT(DISTINCT b.id) AS branch_count,
        COUNT(DISTINCT d.id) AS department_count

      FROM circle_table c

      LEFT JOIN branches b
        ON b.circle_id = c.circle_id

      LEFT JOIN departments d
        ON d.branch_id = b.id

      WHERE c.circle_id = ?
    `;

    const [rows] = await db.query(sql, [circleId]);

    callback(null, rows);

  } catch (err) {

    console.log("CHECK CIRCLE DEPENDENCIES ERROR:", err);

    callback(err, null);

  }
}; 

// Delete Circle
exports.deleteCircle = (circleId, callback) => {

  const sql = `
    DELETE FROM circle_table
    WHERE circle_id = ?
  `;

  db.query(sql, [circleId], (err, result) => {

    if (err) {
      return callback(err, null);
    }

    callback(null, result);

  });
};