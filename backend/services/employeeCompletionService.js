const circularTrackingModel = require("../models/circularTrackingModel");
const circularModel = require("../models/circularModel");
const eventEmitter = require("../events/eventEmitter");

console.log("=======employee completion=======")
async function markEmployeeCompleted(data) {

    const { circularId, employeeId, io } = data;

    // Mark employee completed
    await circularTrackingModel.markAsCompleted(
        circularId,
        employeeId
    );

    console.log("Employee marked completed:", employeeId);

    // Get completion summary
    const [rows] =
        await circularTrackingModel.getCircularCompletionSummary(circularId);

    const totalEmployees = Number(rows[0].totalEmployees);
    const completedEmployees = Number(rows[0].completedEmployees || 0);

    console.log("Completion Summary:", rows);
    console.log("Total Employees:", totalEmployees);
    console.log("Completed Employees:", completedEmployees);

    // Fire event only when every employee has completed
    if (completedEmployees === totalEmployees) {

        console.log(">>> EMITTING ALL_EMPLOYEES_COMPLETED <<<");

        eventEmitter.emit("ALL_EMPLOYEES_COMPLETED", {
            circularId,
            io
        });

    } else {

        console.log(
            `${totalEmployees - completedEmployees} employee(s) still pending`
        );

    }

    return {
        totalEmployees,
        completedEmployees
    };

}

module.exports = {
    markEmployeeCompleted
};