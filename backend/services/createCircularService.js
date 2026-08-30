const circularApprovalModel = require("../models/circularApprovalsModel");
const circularModel = require("../models/circularModel");
const employeeModel = require("../models/employeesModal");
const eventEmitter = require("../events/eventEmitter");

async function processCircularCreation(data) {

    const {
        circularId,
        creatorId,
        approvers,
        io
    } = data;

    if (!Array.isArray(approvers) || approvers.length === 0) {
        return;
    }

    const [circularRows] =
        await circularModel.getCircularById(circularId);

    const circularDetails = circularRows[0];

    for (const approverId of approvers) {

        await circularApprovalModel.createCircularApproval({

            circular_id: circularId,
            approver_id: approverId,
            status: "PENDING"

        });

        eventEmitter.emit("CIRCULAR_ASSIGNED_TO_APPROVER", {

            circularId,
            approverId,
            creatorId,
            io

        });

        // if (io) {

        //     io.to(`approver-${approverId}`).emit("new-circular-assigned", {

        //         circular: circularDetails,
        //         message: "New circular has been assigned to you",
        //         circular_id: circularId

        //     });

        // }

    }

}

module.exports = {
    processCircularCreation
};