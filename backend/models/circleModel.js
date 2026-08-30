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
exports.getAllCircles = async (callback) => {
  try {

    const sql = `
      SELECT 
        c.circle_id,
        c.circle_name,
        c.circle_code,
        c.zone_id,
        z.name AS zone_name,
        c.created_at
      FROM circle_table c
      JOIN zones z
        ON c.zone_id = z.id
      ORDER BY c.circle_name
    `;

    const [rows] = await db.query(sql);

    callback(null, rows);

  } catch (err) {
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