const circularAuditModel = require("../models/circularAuditModel");

async function logAudit(data) {

    const {
        circularId,
        action,
        performedBy,
        targetEmployeeId,
        oldStatus,
        newStatus,
        description
    } = data;

    try {

        await circularAuditModel.createAuditLog({

            circular_id: circularId,
            action: action,
            performed_by: performedBy || null,
            target_employee_id: targetEmployeeId || null,
            old_status: oldStatus || null,
            new_status: newStatus || null,
            description: description || null

        });

        console.log(
            `Audit logged: ${action} for circular ${circularId}`
        );

    } catch (error) {

        console.error(
            `AUDIT LOG FAILED for circular ${circularId}:`,
            error
        );

        // IMPORTANT:
        // Do not stop circular creation if audit logging fails.
    //    return null;
    } 
}

module.exports = {
    logAudit
};