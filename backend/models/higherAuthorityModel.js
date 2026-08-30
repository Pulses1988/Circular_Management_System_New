const db = require("../config/db");

exports.assignCircularToHigherAuthority = async (
    circularId,
    higherAuthorityId,
    creatorId
) => {
    return db.query(
        `INSERT INTO higher_authority_circulars
        (
            circular_id,
            higher_authority_id,
            creator_id
        )
        VALUES (?, ?, ?)`,
        [circularId, higherAuthorityId, creatorId]
    );
};  

//Creators id for higher Authority
// exports.getCircularById = async (circularId) => {
//     return db.query(
//         `SELECT creator_employee_id
//          FROM circulars
//          WHERE id = ?`,
//         [circularId]
//     );
// };



exports.getPendingCircularsByHigherAuthority = async (employeeId) => {
    return db.query(
        `
        SELECT
            hac.id,
            hac.circular_id,
            hac.status,
            hac.assigned_at,

            c.title,
            c.circular_code,
            c.priority,
            c.created_at,

            e.first_name,
            e.last_name

        FROM higher_authority_circulars hac

        JOIN circulars c
            ON hac.circular_id = c.id

        JOIN employees e
            ON hac.creator_id = e.id

        WHERE hac.higher_authority_id = ?
        AND hac.status = 'Pending'

        ORDER BY hac.assigned_at DESC
        `,
        [employeeId]
    );
};