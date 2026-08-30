const publishCircularService = require("../services/publishCircularService");
const notifyApproverService = require("../services/notifyApproverService");
const createCircularService = require("../services/createCircularService");
const ruleExecutionModel = require("../models/ruleExecutionModel");
const circularModel = require("../models/circularModel");
const circularRejectionNotificationService = require("../services/circularRejectionNotificationService");
const circularCompletionNotificationService = require("../services/circularCompletionNotificationService");

async function executeAction(action, data) {

    switch (action) {

        case "SEND_APPROVER_NOTIFICATION":
            await notifyApproverService.notifyApprover(data);
            break;

        case "SEND_CIRCULAR_REJECTION_NOTIFICATION":
            await circularRejectionNotificationService.notifyCreatorOfRejection(data);
            break;

        case "SEND_COMPLETION_STATUS_NOTIFICATION":
            await circularCompletionNotificationService.notifyCreatorOfCompletionStatus(data);
            break;

        case "SEND_ALL_EMPLOYEES_COMPLETED_NOTIFICATION":
            await circularCompletionNotificationService.notifyCreatorAllEmployeesCompleted(data);
            break;

        // ============================================
        // CREATE CIRCULAR
        // ============================================
        case "CREATE_CIRCULAR":

            console.log("=================================");
            console.log("ACTION EXECUTOR");
            console.log("Executing Create Circular Action");
            console.log("Circular ID :", data.circularId);
            console.log("=================================");

            try {

                await createCircularService.processCircularCreation(data);

                await ruleExecutionModel.saveExecution({
                    event_name: "CIRCULAR_CREATED",
                    rule_name: "Create Circular Rule",
                    action_name: "CREATE_CIRCULAR",
                    status: "SUCCESS",
                    entity_id: data.circularId
                });

            } catch (err) {

                console.error("Create Circular Action Failed");
                console.error(err);

                await ruleExecutionModel.saveExecution({
                    event_name: "CIRCULAR_CREATED",
                    rule_name: "Create Circular Rule",
                    action_name: "CREATE_CIRCULAR",
                    status: "FAILED",
                    entity_id: data.circularId
                });

            }

            break;

        // ============================================
        // NOTIFY APPROVER
        // ============================================
        case "NOTIFY_APPROVER":

            console.log("=================================");
            console.log("ACTION EXECUTOR");
            console.log("Executing Notify Approver Action");
            console.log("Circular ID :", data.circularId);
            console.log("Approver ID :", data.approverId);
            console.log("=================================");

            try {

                await notifyApproverService.notifyApprover(data);

                await ruleExecutionModel.saveExecution({
                    event_name: "CIRCULAR_ASSIGNED_TO_APPROVER",
                    rule_name: "Notify Approver Rule",
                    action_name: "NOTIFY_APPROVER",
                    status: "SUCCESS",
                    entity_id: data.circularId
                });

            } catch (err) {

                console.error("Notify Approver Action Failed");
                console.error(err);

                await ruleExecutionModel.saveExecution({
                    event_name: "CIRCULAR_ASSIGNED_TO_APPROVER",
                    rule_name: "Notify Approver Rule",
                    action_name: "NOTIFY_APPROVER",
                    status: "FAILED",
                    entity_id: data.circularId
                });

            }

            break;

        // ============================================
        // PUBLISH CIRCULAR
        // ============================================
        case "PUBLISH_CIRCULAR":

            console.log("=================================");
            console.log("ACTION EXECUTOR");
            console.log("Executing Publish Circular Action");
            console.log("Circular ID :", data.circularId);
            console.log("=================================");

            try {

                await publishCircularService.notifyEmployeesAfterPublish(data);

                await ruleExecutionModel.saveExecution({
                    event_name: "CIRCULAR_FULLY_APPROVED",
                    rule_name: "Publish Circular Rule",
                    action_name: "PUBLISH_CIRCULAR",
                    status: "SUCCESS",
                    entity_id: data.circularId
                });

            } catch (err) {

                console.error("Publish Circular Action Failed");
                console.error(err);

                await ruleExecutionModel.saveExecution({
                    event_name: "CIRCULAR_FULLY_APPROVED",
                    rule_name: "Publish Circular Rule",
                    action_name: "PUBLISH_CIRCULAR",
                    status: "FAILED",
                    entity_id: data.circularId
                });

            }

            break;

case "ENABLE_CREATOR_COMPLETION":

    console.log("=================================");
    console.log("ACTION EXECUTOR");
    console.log("Enable Creator Completion");
    console.log("Circular ID :", data.circularId);
    console.log("=================================");

    await ruleExecutionModel.saveExecution({

        event_name: "ALL_EMPLOYEES_COMPLETED",
        rule_name: "All Employees Completed Rule",
        action_name: "ENABLE_CREATOR_COMPLETION",
        status: "SUCCESS",
        entity_id: data.circularId

    });

    break;


// ============================================
// MARK CIRCULAR COMPLETED
// ============================================
case "MARK_CIRCULAR_COMPLETED":

    console.log("=================================");
    console.log("ACTION EXECUTOR");
    console.log("Executing Mark Circular Completed Action");
    console.log("Circular ID :", data.circularId);
    console.log("=================================");


    try {

        await circularModel.markCircularCompleted(
            data.circularId
        );


        await ruleExecutionModel.saveExecution({

            event_name: "CIRCULAR_COMPLETED",

            rule_name: "Circular Completion Rule",

            action_name: "MARK_CIRCULAR_COMPLETED",

            status: "SUCCESS",

            entity_id: data.circularId

        });


    } catch(err) {


        console.error(
            "Mark Circular Completed Failed"
        );

        console.error(err);



        await ruleExecutionModel.saveExecution({

            event_name: "CIRCULAR_COMPLETED",

            rule_name: "Circular Completion Rule",

            action_name: "MARK_CIRCULAR_COMPLETED",

            status: "FAILED",

            entity_id: data.circularId

        });


    }


break;






        // ============================================
        // DEFAULT
        // ============================================
        default:

            console.log("=================================");
            console.log("No Action Found :", action);
            console.log("=================================");
    }
} 





module.exports = {
    executeAction
};
