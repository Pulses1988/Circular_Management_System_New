const db = require("../config/db");

exports.createAuditLog = async (data) => {

    console.log("========== CREATE AUDIT LOG START ==========");
    console.log("Audit data:", data);

    const {
        circular_id,
        action,
        performed_by,
        target_employee_id,
        old_status,
        new_status,
        description
    } = data;

    const sql = `
        INSERT INTO circular_audit_logs
        (
            circular_id,
            action,
            performed_by,
            target_employee_id,
            old_status,
            new_status,
            description
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        circular_id,
        action,
        performed_by || null,
        target_employee_id || null,
        old_status || null,
        new_status || null,
        description || null
    ];

    console.log("SQL:", sql);
    console.log("VALUES:", values);
    console.log("========== BEFORE DB QUERY ==========");

    try {

        const [result] = await db.query(sql, values);

        console.log("========== DB QUERY SUCCESS ==========");
        console.log("AUDIT INSERT RESULT:", result);

        return result;

    } catch (error) {

        console.error("========== AUDIT DB ERROR ==========");
        console.error(error);

        throw error;
    }
};


/* ============================================
   GET ALL AUDIT LOGS
============================================ */

// exports.getAuditLogs = async () => {

//     const sql = `
//         SELECT
//             id,
//             circular_id,
//             action,
//             performed_by,
//             target_employee_id,
//             old_status,
//             new_status,
//             description,
//             created_at
//         FROM circular_audit_logs
//         ORDER BY created_at DESC
//     `;

//     try {

//         const [rows] = await db.query(sql);

//         return rows;

//     } catch (error) {

//         console.error("========== GET AUDIT LOGS ERROR ==========");
//         console.error(error);

//         throw error;
//     }
// }; 



// exports.getAuditLogs = async () => {

//     const sql = `
//         SELECT
//             cal.id,
//             cal.circular_id,
//             cal.action,
//             cal.performed_by,
//             cal.target_employee_id,
//             cal.old_status,
//             cal.new_status,
//             cal.description,
//             cal.created_at,
//             c.visibility_type AS visibility_type
//         FROM circular_audit_logs cal
//         LEFT JOIN circulars c
//             ON c.id = cal.circular_id
//         ORDER BY cal.created_at DESC
//     `;

//     try {

//         const [rows] = await db.query(sql);

//         return rows;

//     } catch (error) {

//         console.error("========== GET AUDIT LOGS ERROR ==========");
//         console.error(error);

//         throw error;
//     }
// };


exports.getAuditLogs = async () => {

    const sql = `
        SELECT
            cal.id,
            cal.circular_id,
            cal.action,
            cal.performed_by,
            cal.target_employee_id,
            cal.old_status,
            cal.new_status,
            cal.description,
            cal.created_at,

            c.visibility_type AS visibility_type,

            CONCAT_WS(
                ' ',
                e.first_name,
                NULLIF(e.middle_name, ''),
                e.last_name
            ) AS performed_by_name,

            e.employee_id AS performed_by_code

        FROM circular_audit_logs cal

        LEFT JOIN circulars c
            ON c.id = cal.circular_id

        LEFT JOIN employees e
            ON e.id = cal.performed_by

        ORDER BY cal.created_at DESC
    `;

    try {

        const [rows] = await db.query(sql);

        return rows;

    } catch (error) {

        console.error(
            "========== GET AUDIT LOGS ERROR =========="
        );

        console.error(error);

        throw error;

    }

};
/* ============================================
   DELETE AUDIT LOG
============================================ */

exports.deleteAuditLog = async (id) => {

    console.log("========== DELETE AUDIT LOG MODEL ==========");
    console.log("Deleting audit log ID:", id);

    const sql = `
        DELETE FROM circular_audit_logs
        WHERE id = ?
    `;

    try {

        const [result] = await db.query(sql, [id]);

        console.log("DELETE AUDIT RESULT:", result);

        return result;

    } catch (error) {

        console.error("========== DELETE AUDIT LOG ERROR ==========");
        console.error(error);

        throw error;
    }
};   

//Circular completed audit 
/* ============================================
   CHECK CIRCULAR COMPLETED AUDIT
============================================ */

exports.checkCircularCompletedAudit = async (circularId) => {

    const sql = `
        SELECT id
        FROM circular_audit_logs
        WHERE circular_id = ?
          AND action = 'CIRCULAR_COMPLETED'
        LIMIT 1
    `;

    const [rows] = await db.query(sql, [circularId]);

    return rows.length > 0;

};