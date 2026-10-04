const circularAuditModel = require("../models/circularAuditModel");


/* ============================================
   GET ALL AUDIT LOGS
============================================ */

exports.getAuditLogs = async (req, res) => {

    console.log("========== GET AUDIT LOGS ==========");

    try {

        const auditLogs = await circularAuditModel.getAuditLogs();

        console.log("Audit logs count:", auditLogs.length);

        res.status(200).json({
            success: true,
            data: auditLogs
        });

    } catch (error) {

        console.error("GET AUDIT LOGS ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch audit logs",
            error: error.message
        });
    }
}; 

//Delet button 
/* ============================================
   DELETE AUDIT LOG
============================================ */
/* ============================================
   DELETE AUDIT LOG
============================================ */

exports.deleteAuditLog = async (req, res) => {

    console.log("========== DELETE AUDIT LOG ==========");

    const { id } = req.params;

    try {

        const result = await circularAuditModel.deleteAuditLog(id);

        if (result.affectedRows === 0) {

            return res.status(404).json({
                success: false,
                message: "Audit log not found"
            });

        }

        res.status(200).json({
            success: true,
            message: `Audit log ${id} deleted successfully`
        });

    } catch (error) {

        console.error("DELETE AUDIT LOG ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete audit log",
            error: error.message
        });
    }
};