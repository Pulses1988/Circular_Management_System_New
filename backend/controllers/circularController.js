const circularModal = require("../models/circularModel");
const circularApprovalModal = require("../models/circularApprovalsModel");
const circularVisibilityModal = require("../models/circularVisibilityModel");
const employeeModal = require("../models/employeesModal");
const circularTrackingModel = require("../models/circularTrackingModel");
const notificationModel = require("../models/notificationModel");
const repeatCycleModel = require("../models/repeatCyclesModel");
const eventEmitter = require("../events/eventEmitter");
const higherAuthorityModel = require("../models/higherAuthorityModel");

// helper function---------------
async function createCircularTrackingEntries(circularId, employeeIds) {
  if (!Array.isArray(employeeIds) || employeeIds.length === 0) return;

  const trackingData = employeeIds.map((empId) => ({
    circular_id: circularId,
    employee_id: empId,
    is_seen: false,
    seen_at: null,
    is_completed: false,
    completed_at: null,
  }));

  await circularTrackingModel.bulkInsert(trackingData);
}

// -------------------------------

exports.createCircular = async (req, res) => {
  try {
    if (req.body.status !== "DRAFT" && !req.file)
      return res.status(400).json({ error: "PDF file is required" });

    // =============================
    // Repeat Cycle Logic
    // =============================

    let isRecurring = 0;
    let currentCycleNumber = 1;
    let lastRecurrenceDate = null;
    let nextRecurrenceDate = null;

    if (Number(req.body.repeat_cycle) !== 1) {
      isRecurring = 1;

      lastRecurrenceDate = new Date();

      const [cycleRows] = await repeatCycleModel.getDurationById(
        req.body.repeat_cycle,
      );

      if (cycleRows.length > 0) {
        nextRecurrenceDate = new Date();

        nextRecurrenceDate.setDate(
          nextRecurrenceDate.getDate() + cycleRows[0].duration_days,
        );
      }
    }

    const data = {
      title: req.body.title,
      content: req.body.content || null,
      creator_employee_id: req.body.creator_employee_id,
      pdfBuffer: req.file ? req.file.buffer : null,
      reference_circular_id: req.body.reference_circular_id || null,
      circular_code: req.body.circular_code,

      source_type_id: req.body.source_type_id || null,
      effective_from: req.body.effective_from || null,
      send_type: req.body.send_type,
      repeat_cycle_id: req.body.repeat_cycle,

      is_recurring: isRecurring,
      current_cycle_number: currentCycleNumber,
      last_recurrence_date: lastRecurrenceDate,
      next_recurrence_date: nextRecurrenceDate,

      status: req.body.status,
      published_at: req.body.published_at || null,
      special_keyword: req.body.specialKeyword,
      priority: req.body.priority,
    };

    const [result] = await circularModal.createCircular(data);
    const circularId = result.insertId;

    
     // Trigger Event
    // eventEmitter.emit("CIRCULAR_CREATED", {
    //   circularId: circularId,
    //   creatorId: req.body.creator_employee_id,
    //   priority: req.body.priority,
    // });

    const approvers = req.body.approvers ? JSON.parse(req.body.approvers) : [];
   
    const io = req.app.get("io");

   



  //   if (Array.isArray(approvers) && approvers.length > 0)
  // {
  //     const io = req.app.get("io");
  //     const [circularRows] = await circularModal.getCircularById(circularId);
  //     const circularDetails = circularRows[0];
  //     const [creatorRows] = await employeeModal.getEmployeeById(
  //       req.body.creator_employee_id,
  //     );
  //     const creator = creatorRows[0];
  //     for (const approverId of approvers) 
        
  //     {
  //       await circularApprovalModal.createCircularApproval({
  //         circular_id: circularId,
  //         approver_id: approverId,
  //         status: "PENDING",
  //       });
     
  //     eventEmitter.emit("CIRCULAR_ASSIGNED_TO_APPROVER", {
  //        circularId,
  //       approverId,
  //       creatorId: req.body.creator_employee_id,
  //       io
  //     });
// const approvers = req.body.approvers
//   ? JSON.parse(req.body.approvers)
//   : [];

if (Array.isArray(approvers) && approvers.length > 0) {

    const io = req.app.get("io");

    for (const approverId of approvers) {

        console.log("Before Insert");
        console.log("Circular:", circularId);
        console.log("Approver:", approverId);

        await circularApprovalModal.createCircularApproval({
            circular_id: circularId,
            approver_id: approverId,
            status: "PENDING",
        });

        console.log("Inserted");

        eventEmitter.emit("CIRCULAR_ASSIGNED_TO_APPROVER", {
            circularId,
            approverId,
            creatorId: req.body.creator_employee_id,
            io
        });
    







       


          // const notificationId = await notificationModel.createNotification({
          //   circular_id: circularId,
          //   recipient_employee_id: approverId,
          //   sender_employee_id: req.body.creator_employee_id,
          //   notification_type: "message",
          //   message_preview: `New circular "${circularDetails.title}" requires your approval`,
          // });
          // io.to(`notifications-${approverId}`).emit("new-notification", {
          //   notification_id: notificationId,
          //   circular_id: circularId,
          //   sender_first_name: creator.first_name,
          //   sender_last_name: creator.last_name,
          //   notification_type: "message",
          //   message_preview: `New circular "${circularDetails.title}" requires your approval`,
          //   circular_title: circularDetails.title,
          //   circular_code: circularDetails.circular_code,
          // });
        // }
        
      }
     }

    // ✅ Save visibility employees
    // Approver records must exist before CIRCULAR_CREATED rules resolve them.
    eventEmitter.emit("CIRCULAR_CREATED", {
      circularId,
      creatorId: req.body.creator_employee_id,
      approvers,
      io,
      priority: req.body.priority,
    });

    const visiblityEmployee = req.body.visiblityEmployee
      ? JSON.parse(req.body.visiblityEmployee)
      : [];
    if (Array.isArray(visiblityEmployee) && visiblityEmployee.length > 0) {
      await circularVisibilityModal.assignToEmployees(
        circularId,
        visiblityEmployee,
      );
      await createCircularTrackingEntries(circularId, visiblityEmployee); // <-- Tracking added
    }

    if (req.body.send_type === "INTERNAL") {
      if (req.body.headOfficeId && req.body.departmentId) {
        const deptEmployee =
          await circularVisibilityModal.getEmployeesByDepartment(
            req.body.departmentId,
          );

        if (deptEmployee.length > 0) {
          // const empIds = deptEmployee.map((e) => e.id);
          const empIds = deptEmployee;
          await circularVisibilityModal.assignToEmployees(circularId, empIds);
          await createCircularTrackingEntries(circularId, empIds); // <-- Tracking added
        }
      }

      if (req.body.branchId && req.body.departmentId) {
        const branchEmployees =
          await circularVisibilityModal.getEmployeesByDepartment(
            req.body.departmentId,
          );
        if (branchEmployees.length > 0) {
          // const empIds = branchEmployees.map((e) => e.id);
          const empIds = branchEmployees;
          await circularVisibilityModal.assignToEmployees(circularId, empIds);
          await createCircularTrackingEntries(circularId, empIds); // <-- Tracking added
        }
      }

      if (req.body.branchId) {
        const branchDepartmentEmployees =
          await circularVisibilityModal.getEmployeesByBranch(req.body.branchId);

        if (branchDepartmentEmployees.length > 0) {
          // const empIds = branchDepartmentEmployees.map((e) => e.id);
          const empIds = branchDepartmentEmployees;
          await circularVisibilityModal.assignToEmployees(circularId, empIds);
          await createCircularTrackingEntries(circularId, empIds); // <-- Tracking added
        }
      }
    }

    // 4️⃣ Automatically assign all employees for PUBLIC circulars
    if (req.body.send_type === "PUBLIC") {
      const [allEmployees] = await employeeModal.getAllEmployees();
      if (allEmployees.length > 0) {
        const allEmployeeIds = allEmployees.map((e) => e.id);
        await circularVisibilityModal.assignToEmployees(
          circularId,
          allEmployeeIds,
        );
        await createCircularTrackingEntries(circularId, allEmployeeIds); // <-- Tracking added

        eventEmitter.emit("CIRCULAR_ASSIGNED_TO_EMPLOYEES", {
          circularId,
          employeeCount: allEmployeeIds.length,
        });
      }
    }

    res.status(201).json({ message: "Circular created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create circular" });
  }
};

exports.getCircularapproverandemployeeById = async (req, res) => {
  try {
    const circularId = req.params.id;
    const [circularRows] = await circularModal.getCircularById(circularId);
    if (!circularRows.length)
      return res.status(404).json({ error: "Circular not found" });

    const circular = circularRows[0];
    // Get approvers
    const [approverRows] =
      await circularApprovalModal.getApproversByCircularId(circularId);
    circular.selectedApprovers = approverRows.map((a) => a.approver_id);

    // Get visibility employees
    const [visibilityRows] =
      await circularVisibilityModal.getEmployeesByCircularId(circularId);
    circular.selectedEmployees = visibilityRows.map((e) => ({
      id: e.employee_id,
      name: e.employee_name,
    }));

    res.json(circular);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch circular" });
  }
};

// ✅ Get All Circulars
exports.getAllCirculars = async (req, res) => {
  try {
    const [rows] = await circularModal.getAllCirculars();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch circulars" });
  }
};

// ✅ Get Circular by ID
exports.getCircularById = async (req, res) => {
  try {
    const [rows] = await circularModal.getCircularById(req.params.id);
    if (rows.length === 0)
      return res.status(404).json({ error: "Circular not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch circular" });
  }
};

// get circular all approved

exports.getAllApprovedCirculars = async (req, res) => {
  try {
    const [rows] = await circularModal.getAllApprovedCirculars();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch circular" });
  }
};

// get circular by creater id

exports.getCircularByCreaterId = async (req, res) => {
  try {
    const [rows] = await circularModal.getCircularByCreaterId(
      req.params.createrId,
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No circulars found for this creator" });
    }

    // Aggregate circulars by circular id
    const circularMap = new Map();

    rows.forEach((row) => {
      if (!circularMap.has(row.id)) {
        circularMap.set(row.id, {
          id: row.id,
          title: row.title,
          content: row.content,
          circular_code: row.circular_code,
          send_type: row.send_type,
          status: row.status,
          effective_from: row.effective_from,
          published_at: row.published_at,
          created_at: row.created_at,
          reference_circular_id: row.reference_circular_id,
          source_type_id: row.source_type_id,
          source_type_name: row.source_type_name,
          repeat_cycle_id: row.repeat_cycle_id,
          repeat_cycle_name: row.repeat_cycle_name,
          priority: row.priority,
          pdf: row.circular_pdf ? row.circular_pdf.toString("base64") : null,

          // repeat_cycle_duration: row.repeat_cycle_duration,
          creator: {
            first_name: row.creator_first_name,
            middle_name: row.creator_middle_name,
            last_name: row.creator_last_name,
            email: row.creator_email,
          },
          approvals: [],
        });
      }

      // Add approval if it exists
      if (row.approval_id) {
        circularMap.get(row.id).approvals.push({
          id: row.approval_id,
          status: row.approval_status,
          comments: row.comments,
          updated_at: row.approval_updated_at,
          approver: {
            first_name: row.approver_first_name,
            middle_name: row.approver_middle_name,
            last_name: row.approver_last_name,
            email: row.approver_email,
          },
        });
      }
    });

    // Convert map to array
    const circulars = Array.from(circularMap.values());

    res.json(circulars);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch circulars" });
  }
};

// ✅ Update Circular
exports.updateCircular = async (req, res) => {
  try {
    const circularData = req.body.circular ? JSON.parse(req.body.circular) : {};

    const data = {
      title: circularData.title,
      content: circularData.content || null,
      reference_circular_id: circularData.reference_circular_id || null,
      circular_code: circularData.circular_code,
      source_type_id: circularData.source_type_id,
      effective_from: circularData.effective_from,
      send_type: circularData.send_type,
      repeat_cycle_id:
        circularData.repeat_cycle_id || circularData.repeat_cycle,
      status: circularData.status,
      published_at: circularData.published_at || null,
      pdfBuffer: req.file ? req.file.buffer : null,
      special_keyword: circularData.specialKeyword,
      priority: circularData.priority,
    };

    const [result] = await circularModal.updateCircular(req.params.id, data);

    eventEmitter.emit("CIRCULAR_UPDATED", {
      circularId: req.params.id,
    });

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Circular not found" });

    console.log(circularData.selectedEmployees);

    if (Array.isArray(circularData.selectedApprovers)) {
      const newApprovers = circularData.approvers;
      console.log("new approvers" + newApprovers);

      const [existingApproversRows] =
        await circularApprovalModal.getApproversByCircularId(req.params.id);
      const existingApprovers = existingApproversRows.map((a) => a.approver_id);

      const approversToAdd = newApprovers.filter(
        (id) => !existingApprovers.includes(id),
      );
      const approversToRemove = existingApprovers.filter(
        (id) => !newApprovers.includes(id),
      );

      for (const approverId of approversToAdd) {
        await circularApprovalModal.createCircularApproval({
          circular_id: req.params.id,
          approver_id: approverId,
          status: "PENDING",
        });
      }

      if (approversToRemove.length > 0) {
        await circularApprovalModal.removeApproversFromCircular(
          req.params.id,
          approversToRemove,
        );
      }
    }

    if (circularData.send_type === "INTERNAL") {
      await circularVisibilityModal.removeAllEmployeesFromCircular(
        req.params.id,
      );

      const createrId = circularData.creator_employee_id;
      console.log(createrId);

      const [rows] = await employeeModal.getEmployeeById(createrId);
      const creatorData = rows[0]; // actual employee object

      console.log("creator data:", creatorData);

      if (creatorData.head_office_id && creatorData.department_id) {
        const deptEmployee =
          await circularVisibilityModal.getEmployeesByDepartment(
            creatorData.department_id,
          );

        if (deptEmployee.length > 0) {
          await circularVisibilityModal.assignToEmployees(
            req.params.id,
            deptEmployee,
          );
        }
      }

      if (creatorData.branch_id && creatorData.department_id) {
        const branchEmployees =
          await circularVisibilityModal.getEmployeesByDepartment(
            creatorData.department_id,
          );

        if (branchEmployees.length > 0) {
          await circularVisibilityModal.assignToEmployees(
            req.params.id,
            branchEmployees,
          );
        }
      }

      if (creatorData.branch_id) {
        const branchDepartmentEmployees =
          await circularVisibilityModal.getEmployeesByBranch(
            creatorData.branch_id,
          );

        if (branchDepartmentEmployees.length > 0) {
          await circularVisibilityModal.assignToEmployees(
            req.params.id,
            branchDepartmentEmployees,
          );
        }
      }
    } else if (circularData.send_type === "PUBLIC") {
      await circularVisibilityModal.removeAllEmployeesFromCircular(
        req.params.id,
      );
      const [allEmployees] = await employeeModal.getAllEmployees();
      if (allEmployees.length > 0) {
        const allEmployeeIds = allEmployees.map((e) => e.id);
        await circularVisibilityModal.assignToEmployees(
          req.params.id,
          allEmployeeIds,
        );
      }
    } else {
      const newEmployees =
        circularData.selectedEmployees?.map((e) => e.id) || [];

      const [currentVisibilities] =
        await circularVisibilityModal.getEmployeesByCircularId(req.params.id);
      const existingEmployeeIds = currentVisibilities.map((e) => e.employee_id);
      console.log(existingEmployeeIds);

      const employeesToAdd = newEmployees.filter(
        (id) => !existingEmployeeIds.includes(id),
      );
      console.log("employees to add " + employeesToAdd);

      const employeesToRemove = existingEmployeeIds.filter(
        (id) => !newEmployees.includes(id),
      );
      console.log("employees to remove" + employeesToRemove);

      if (employeesToAdd.length > 0) {
        await circularVisibilityModal.assignToEmployees(
          req.params.id,
          employeesToAdd,
        );
      }

      if (employeesToRemove.length > 0) {
        await circularVisibilityModal.removeEmployeesFromCircular(
          req.params.id,
          employeesToRemove,
        );
      }
    }

    res.json({ message: "Circular updated successfully" });
  } catch (err) {
    console.error("Update circular error:", err);
    res.status(500).json({ error: "Failed to update circular" });
  }
};

// ✅ Delete Circular
exports.deleteCircular = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Circular ID is required",
      });
    }

    const result = await circularModal.deleteCircular(id);

    eventEmitter.emit("CIRCULAR_DELETED", {
      circularId: id,
    });

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Circular not found",
      });
    }

    res.json({
      success: true,
      message: "Circular deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteCircular controller:", error);

    if (error.message === "Circular not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message ===
      "Circular can only be deleted if it is in DRAFT or REJECTED status"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.getAllCircularsByEmployeeIdWithTrackingDetails = async (req, res) => {
  try {
    const { employee_id } = req.params;
    if (!employee_id) {
      return res.status(400).json({ error: "Employee ID is required" });
    }

    const circulars =
      await circularModal.getAllCircularsByEmployeeIdWithTrackingDetails(
        employee_id,
      );

    res.status(200).json({
      message: "Circulars with tracking details fetched successfully",
      data: circulars,
    });
  } catch (err) {
    console.error("Error fetching circulars with tracking details:", err);
    res.status(500).json({ error: "Failed to fetch circulars" });
  }
};
exports.getCircularDetailsById = async (req, res) => {
  try {
    const { circular_id } = req.params;

    if (!circular_id) {
      return res.status(400).json({ error: "Circular ID is required" });
    }

    const circularDetails =
      await circularModal.getCircularDetailsById(circular_id);

    if (!circularDetails) {
      return res.status(404).json({ error: "Circular not found" });
    }

    res.status(200).json(circularDetails);
  } catch (error) {
    console.error("Error fetching circular details:", error);
    res.status(500).json({ error: "Failed to fetch circular details" });
  }
};
exports.getCircularActivitySummary = async (req, res) => {
  try {
    const { circular_id } = req.params;

    const summary = await circularModal.getCircularActivitySummary(circular_id);

    if (!summary) {
      return res.status(404).json({ error: "Circular not found" });
    }

    res.status(200).json(summary);
  } catch (error) {
    console.error("Error fetching activity summary:", error);
    res.status(500).json({ error: "Failed to fetch activity summary" });
  }
};

//Creator circular completion api
exports.creatorMarkCompleted = async (req, res) => {
  try {
    const { circularId } = req.body;

    if (!circularId) {
      return res.status(400).json({
        message: "Circular ID required",
      });
    }

    const [rows] =
      await circularTrackingModel.getCircularCompletionSummary(circularId);

    const totalEmployees = rows[0].totalEmployees;

    const completedEmployees = rows[0].completedEmployees || 0;

    const pendingEmployees = totalEmployees - completedEmployees;

    if (pendingEmployees > 0) {
      // return res.status(400).json({

      //   success:false,

      //   message:
      //   `${pendingEmployees} employee(s) have not completed the circular`,

      //   pendingEmployees

      // });
      const [pendingList] =
        await circularTrackingModel.getPendingEmployees(circularId);

      return res.status(400).json({
        success: false,
        message: `${pendingEmployees} employee(s) have not completed the circular.`,
        pendingEmployees: pendingList,
      });
    }

    await circularModal.markCircularCompleted(circularId);

    // Get creator
const [circularRows] = await circularModal.getCircularById(circularId);
     //Creator ID
     const creatorId = circularRows[0].creator_employee_id;

    // Find higher authority 


// const [higherAuthority] =
//     await employeeModal.getHigherAuthority(creatorId);
//     console.log("HIgher Authority:",higherAuthority);
//     console.log(higherAuthority);

// await higherAuthorityModel.assignCircularToHigherAuthority(
//     circularId,
//     higherAuthority[0].id,
//     creatorId
// );

//     console.log("Creator:", creatorId);
// console.log("Higher Authority:", higherAuthority);

//     eventEmitter.emit("CIRCULAR_COMPLETED", {
//       circularId: circularId,
    
//     });  

const [higherAuthority] =
    await employeeModal.getHigherAuthority(creatorId);

console.log("Higher Authority:", higherAuthority);

if (higherAuthority && higherAuthority.length > 0) {

    // Higher authority exists
    await higherAuthorityModel.assignCircularToHigherAuthority(
        circularId,
        higherAuthority[0].id,
        creatorId
    );

    console.log(
        "Circular assigned to Higher Authority:",
        higherAuthority[0].id
    );

} else {

    // No higher authority means this is the top-level authority
    console.log(
        "No higher authority found. This is the final authority."
    );

}

console.log("Creator:", creatorId);

eventEmitter.emit("CIRCULAR_COMPLETED", {
    circularId: circularId,
});















    res.json({
      success: true,

      message: "Circular marked as completed successfully",
    });
  } catch (error) {
    console.error("Creator completion error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
};
