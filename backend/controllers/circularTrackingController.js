const circularTrackingModel = require('../models/circularTrackingModel');
const auditService = require("../services/auditService");
const employeeModal = require("../models/employeesModal");
const circularAuditModel = require("../models/circularAuditModel");
const circularModel = require("../models/circularModel");
const eventEmitter = require("../events/eventEmitter");
const employeeCompletionService = require("../services/employeeCompletionService");
exports.getUnseenCirculars = async (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    const [rows] = await circularTrackingModel.getUnseenByEmployee(employeeId);
    res.json({ message: 'Unseen circulars fetched', data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch unseen circulars' });
  }
};

exports.getSeenCirculars=async(req,res)=>{
  try{
    const employeeId= req.params.employeeId;
    const[rows]=await circularTrackingModel.getSeenByEmployee(employeeId);
    res.json({massage: 'Senn Circulars fetched', data:rows});
  }catch(err){
    console.error(err);
    res.status(500).json({error:'failed to fetch seen circulars'})
  }
}

// exports.markSeen = async (req, res) => {
//   try {
//     const { circularId, employeeId } = req.body;
//     await circularTrackingModel.markAsSeen(circularId, employeeId);
//     res.json({ message: 'Circular marked as seen' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Failed to mark circular as seen' });
//   }
// }; 

exports.markSeen = async (req, res) => {
  try {
    const { circularId, employeeId } = req.body;

    const result = await circularTrackingModel.markAsSeen(
      circularId,
      employeeId
    );


//Adding code for  description 
const [employeeRows] = await employeeModal.getEmployeeById(employeeId);

const employeeCode =
  employeeRows.length > 0
    ? employeeRows[0].employee_id
    : employeeId;


    // Add audit log only when the employee was newly marked as seen
    if (result[0].affectedRows > 0) {
      await auditService.logAudit({
        circularId: circularId,
        action: "EMPLOYEE_READ_CIRCULAR",
        performedBy: employeeId,
        targetEmployeeId: employeeId,
        oldStatus: "UNSEEN",
        newStatus: "SEEN",
        // description: `Employee ${employeeId} read circular ${circularId}` 
        description: `Employee ${employeeCode} read circular ${circularId}`

      });
    }

    res.json({ message: "Circular marked as seen" });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to mark circular as seen"
    });
  }
};





exports.markCompleted = async (req, res) => {
  // try {
  //   const { circularId, employeeId } = req.body;
  //   await circularTrackingModel.markAsCompleted(circularId, employeeId);
  //   res.json({ message: 'Circular marked as completed' });
  // } catch (err) {
  //   console.error(err);
  //   res.status(500).json({ error: 'Failed to mark circular as completed' });
  // } 
//new logic
 try {
    const { circularId, employeeId } = req.body;

    // Check if circular exists
    const [circularRows] = await circularModel.getCircularById(circularId);

    if (circularRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Circular not found"
      });
    }

    // Check if circular is approved
    if (circularRows[0].status !== "APPROVED") {
      return res.status(400).json({
        success: false,
        message: "You cannot mark this circular as completed until it is approved."
      });
    }

    // Mark completed 



// await circularTrackingModel.markAsCompleted(circularId, employeeId);
// const [rows] =
//   await circularTrackingModel.getCircularCompletionSummary(circularId);

// const totalEmployees = rows[0].totalEmployees;
// const completedEmployees = rows[0].completedEmployees || 0;

// // Fire event only when all employees have completed
// if (completedEmployees === totalEmployees) {

//     console.log(">>> EMITTING ALL_EMPLOYEES_COMPLETED <<<");
//     eventEmitter.emit("ALL_EMPLOYEES_COMPLETED", {
//         circularId
//     });

// } 


// Mark completed 


const completionResult = await circularTrackingModel.markAsCompleted(circularId, employeeId);

console.log("Employee marked completed:", employeeId);

// This is deliberately separate from CIRCULAR_COMPLETED, which represents
// the creator's later circular-completion workflow.  Emit only after the
// existing tracking update has succeeded.
if (completionResult[0].affectedRows > 0) {
    eventEmitter.emit("EMPLOYEE_COMPLETED_CIRCULAR", {
        circularId,
        employeeId,
        io: req.app.get('io')
    }); 

    // New audit logging
   
const [employeeRows] =
    await employeeModal.getEmployeeById(employeeId);

const employeeCode =
    employeeRows.length > 0
        ? employeeRows[0].employee_id
        : employeeId;

await auditService.logAudit({
    circularId: circularId,
    action: "EMPLOYEE_COMPLETED_CIRCULAR",
    performedBy: employeeId,
    targetEmployeeId: employeeId,
    oldStatus: "PENDING",
    newStatus: "COMPLETED",
    description: `Employee ${employeeCode} completed circular ${circularId}`
});






} 





const [rows] =
    await circularTrackingModel.getCircularCompletionSummary(circularId);

console.log("Completion Summary:", rows);

const totalEmployees = Number(rows[0].totalEmployees);
const completedEmployees = Number(rows[0].completedEmployees || 0);

console.log("Total Employees:", totalEmployees);
console.log("Completed Employees:", completedEmployees);

// if (completedEmployees === totalEmployees) {

//     console.log(">>> EMITTING ALL_EMPLOYEES_COMPLETED <<<");

//     eventEmitter.emit("ALL_EMPLOYEES_COMPLETED", {
//         circularId,
//         employeeId,
//         io: req.app.get('io')
//     });

// } else {

//     console.log("Still Pending Employees:",
//         totalEmployees - completedEmployees);

// }


if (
    totalEmployees > 0 &&
    completedEmployees === totalEmployees
) {

    console.log(">>> ALL EMPLOYEES COMPLETED <<<");

    // Check if Circular Completed audit already exists
    const auditAlreadyExists =
        await circularAuditModel.checkCircularCompletedAudit(
            circularId
        );

    // Add Circular Completed audit only once
    if (!auditAlreadyExists) {

        await auditService.logAudit({

            circularId: circularId,

            action: "CIRCULAR_COMPLETED",

            performedBy: employeeId,

            targetEmployeeId: null,

            oldStatus: "APPROVED",

            newStatus: "COMPLETED",

            description:
                `All employees completed circular ${circularId}`

        });

        console.log(
            "Circular Completed Audit Logged:",
            circularId
        );

    } else {

        console.log(
            "Circular Completed Audit already exists:",
            circularId
        );

    }

    // EXISTING EVENT — KEEP IT
    eventEmitter.emit("ALL_EMPLOYEES_COMPLETED", {

        circularId,

        employeeId,

        io: req.app.get('io')

    });

} else {

    console.log(
        "Still Pending Employees:",
        totalEmployees - completedEmployees
    );

}


    return res.json({
      success: true,
      message: "Circular marked as completed"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: "Failed to mark circular as completed"
    });
  }

  
};





exports.getCompletionStatus = async (req, res) => {
  try {
    const { circularId, employeeId } = req.params;
    const [rows] = await circularTrackingModel.getCompletionStatus(circularId, employeeId);
    
    if (rows.length > 0) {
      res.json({ 
        is_completed: rows[0].is_completed,
        completed_at: rows[0].completed_at
      });
    } else {
      res.json({ is_completed: false, completed_at: null });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch completion status' });
  }
};


exports.getStatistics = async (req, res) => {

  try {

    const employeeId = req.params.employeeId;

    const [rows] = await circularTrackingModel.getStatistics(employeeId);

    const stats = rows[0];

    const compliance =
      stats.readCirculars > 0
        ? Math.round((stats.completedCirculars / stats.readCirculars) * 100)
        : 0;

    res.json({

      totalCirculars: stats.totalCirculars,

      readCirculars: stats.readCirculars,

      unreadCirculars: stats.unreadCirculars,

      completedCirculars: stats.completedCirculars,

      compliance

    });

  } catch (err) {

    console.error(err);

    res.status(500).json({

      error: "Failed to fetch statistics"

    });

  }

};   



// Get read and completion status of all assigned employees
exports.getCompletionStatusEmployees = async (req, res) => {
  try {
    const { circularId } = req.params;

    const [rows] =
      await circularTrackingModel.getCompletionStatusEmployees(circularId);

    const pendingReadEmployees = rows.filter(
      employee => !employee.is_seen
    );

    const pendingCompletionEmployees = rows.filter(
      employee => employee.is_seen && !employee.is_completed
    );

    const completedEmployees = rows.filter(
      employee => employee.is_completed
    );

    res.json({
      success: true,

      totalEmployees: rows.length,

      readEmployees: rows.filter(employee => employee.is_seen).length,

      completedEmployees: completedEmployees.length,

      pendingReadCount: pendingReadEmployees.length,

      pendingCompletionCount: pendingCompletionEmployees.length,

      pendingReadEmployees,

      pendingCompletionEmployees,

      completedEmployeeList: completedEmployees
    });

  } catch (err) {
    console.error(
      "Failed to fetch employee completion status:",
      err
    );

    res.status(500).json({
      success: false,
      error: "Failed to fetch employee completion status"
    });
  }
};


