const circularTrackingModel = require('../models/circularTrackingModel');
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

exports.markSeen = async (req, res) => {
  try {
    const { circularId, employeeId } = req.body;
    await circularTrackingModel.markAsSeen(circularId, employeeId);
    res.json({ message: 'Circular marked as seen' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to mark circular as seen' });
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
}

const [rows] =
    await circularTrackingModel.getCircularCompletionSummary(circularId);

console.log("Completion Summary:", rows);

const totalEmployees = Number(rows[0].totalEmployees);
const completedEmployees = Number(rows[0].completedEmployees || 0);

console.log("Total Employees:", totalEmployees);
console.log("Completed Employees:", completedEmployees);

if (completedEmployees === totalEmployees) {

    console.log(">>> EMITTING ALL_EMPLOYEES_COMPLETED <<<");

    eventEmitter.emit("ALL_EMPLOYEES_COMPLETED", {
        circularId,
        employeeId,
        io: req.app.get('io')
    });

} else {

    console.log("Still Pending Employees:",
        totalEmployees - completedEmployees);

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


