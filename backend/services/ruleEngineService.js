const ruleEngineModel = require("../models/ruleEngineModel");
const circularVisibilityModel = require("../models/circularVisibilityModel");
const circularTrackingModel = require("../models/circularTrackingModel");
const circularApprovalModel = require("../models/circularApprovalsModel");
const actionExecutor = require("../ruleEngine/actionExecutor");
const ruleExecutionModel = require("../models/ruleExecutionModel");

const NOTIFICATION_ACTIONS = new Set([
    "SEND_APPROVER_NOTIFICATION",
    "SEND_CIRCULAR_REJECTION_NOTIFICATION",
    "SEND_COMPLETION_STATUS_NOTIFICATION",
    "SEND_ALL_EMPLOYEES_COMPLETED_NOTIFICATION",
]);

/**
 * Execute all active rules for an event
 *
 * Example:
 * executeRules("CIRCULAR_PUBLISHED",{
 *      circularId:10,
 *      priority:"HIGH"
 * })
 */

exports.executeRules = async (eventName, eventData) => {

    try {

        console.log("=====================================");
        console.log("RULE ENGINE STARTED");
        console.log("Event :", eventName);
        console.log("=====================================");

        // Get all active rules for this event
        const [rules] =
            await ruleEngineModel.getActiveRulesByEvent(eventName);

        if (!rules.length) {

            console.log("No Active Rules Found");

            return;
        }

        console.log("Total Active Rules :", rules.length);

//         // Execute every rule
        for (const rule of rules) {

            console.log("--------------------------------");
            console.log("Executing Rule :", rule.rule_name);

//             // Check condition
            const matched = checkCondition(rule, eventData);

            if (!matched) {

                console.log("Condition Failed");

                continue;
            }

            console.log("Condition Passed");

            // These event notifications resolve recipients from the circular
            // itself, and must not enter the visibility/tracking workflow.
            if (NOTIFICATION_ACTIONS.has(rule.action_name)) {
                try {
                    if (rule.action_name === "SEND_APPROVER_NOTIFICATION") {
                        const [approvers] = await circularApprovalModel
                            .getApproversByCircularId(eventData.circularId);

                        for (const approval of approvers) {
                            await actionExecutor.executeAction(rule.action_name, {
                                ...eventData,
                                approverId: approval.approver_id,
                            });
                        }
                    } else {
                        await actionExecutor.executeAction(rule.action_name, {
                            ...eventData,
                            ruleId: rule.id,
                        });
                    }

                    await ruleExecutionModel.saveExecution({
                        rule_id: rule.id,
                        event_name: eventName,
                        rule_name: rule.rule_name,
                        action_name: rule.action_name,
                        status: "SUCCESS",
                        entity_id: eventData.circularId,
                    });
                } catch (error) {
                    console.error("Notification Rule Failed:", error);
                    await ruleExecutionModel.saveExecution({
                        rule_id: rule.id,
                        event_name: eventName,
                        rule_name: rule.rule_name,
                        action_name: rule.action_name,
                        status: "FAILED",
                        entity_id: eventData.circularId,
                    });
                }

                continue;
            }

//             // Remaining logic
//             // (Resolve employees and assign circular)
//             // We will write this in Part 2.


//             // ===============================
// // Resolve Employees
// // ===============================

let employeeIds = [];

switch (rule.target_type) {

    case "EMPLOYEE":

        employeeIds.push(rule.target_id);

        break;

    case "DEPARTMENT":

        employeeIds =
            await circularVisibilityModel.getEmployeesByDepartment(
                rule.target_id
            );

        break;

    case "ROLE":

        employeeIds =
            await circularVisibilityModel.getEmployeesByRole(
                rule.target_id
            );

        break;

    case "BRANCH":

        employeeIds =
            await circularVisibilityModel.getEmployeesByBranch(
                rule.target_id
            );

        break;

    case "HEAD_OFFICE":

        employeeIds =
            await circularVisibilityModel.getEmployeesByHeadOffice(
                rule.target_id
            );

        break;

    default:

        console.log("Unknown Target Type");

        continue;

}

// // Remove duplicate employees
employeeIds = [...new Set(employeeIds)];

console.log("Employees Found :", employeeIds);

// // No employees
if (employeeIds.length === 0) {

    console.log("No Employees Found");

    continue;

}

// // ===============================
// // Assign Circular Visibility
// // ===============================

await circularVisibilityModel.assignToEmployees(
    eventData.circularId,
    employeeIds
);

console.log("Circular Assigned Successfully");

// // ===============================
// // Create Tracking Records
// // ===============================

const trackingData = employeeIds.map(empId => ({

    circular_id: eventData.circularId,

    employee_id: empId,

    is_seen: false,

    seen_at: null,

    is_completed: false,

    completed_at: null

}));

await circularTrackingModel.bulkInsert(trackingData);

console.log("Tracking Created Successfully");

        }

    } catch (error) {

        console.error("Rule Engine Error :", error);

    }

};


/**
 * Check Rule Condition
 */

function checkCondition(rule, eventData) {

    // No condition
    if (
        !rule.condition_field ||
        !rule.condition_operator ||
        rule.condition_value == null
    ) {

        return true;

    }

    const value =
        eventData[rule.condition_field];

    switch (rule.condition_operator) {

        case "=":
            return String(value) === String(rule.condition_value);

        case "!=":
            return String(value) !== String(rule.condition_value);

        case ">":
            return Number(value) > Number(rule.condition_value);

        case "<":
            return Number(value) < Number(rule.condition_value);

        case ">=":
            return Number(value) >= Number(rule.condition_value);

        case "<=":
            return Number(value) <= Number(rule.condition_value);

        default:
            return false;

    }

}
