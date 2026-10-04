const circularApprovalModel = require("../models/circularApprovalsModel");
const notificationModel = require("../models/notificationModel");
const circularModel = require("../models/circularModel");
const employeeModel = require("../models/employeesModal");
const circularVisibilityModel = require("../models/circularVisibilityModel")
const eventEmitter = require("../events/eventEmitter");
// const circularAuditService = require("../services/circularAuditService");
const auditService = require("../services/auditService");
const emitCircularUpdate = (req, approver_id, eventType, data) => {
  const io = req.app.get('io');
  if (io) {
    io.to(`approver-${approver_id}`).emit(eventType, data);
  }
};

// Get all approvals
exports.getAllCircularApprovals = async (req, res) => {
  try {
    const [rows] = await circularApprovalModel.getAllCircularApprovals();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch circular approvals" });
  }
};

// Get all approvals with related data
exports.getAllCircularApprovalsWithRelations = async (req, res) => {
  try {
    const [rows] =
      await circularApprovalModel.getAllCircularApprovalsWithRelations();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Failed to fetch approvals with related data" });
  }
};

// Get by ID
exports.getCircularApprovalById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await circularApprovalModel.getCircularApprovalById(id);
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch approval" });
  }
};

// exports.getCircularApprovalByEmpId= async (req,res)=>{
//   const {approver_id }= req.params;
//   try{
//     const[rows]= await circularApprovalModel.getcircularApprovalByEmpID(approver_id );
//     if(rows.length === 0) return res.status(404).json({ error: "Not found" });
//     res.json(rows[0]);
//   }catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to fetch approval table data by Emp Id" });
//   }
// }
exports.getCircularApprovalByEmpId = async (req, res) => {

  const { approver_id } = req.params;

  try {

    const [rows] =
      await circularApprovalModel
        .getcircularApprovalByEmpID(approver_id);

    if (rows.length === 0) {

      return res.status(200).json([]);

    }

    // Return ALL approval records
    res.json(rows);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Failed to fetch approval table data by Emp Id"
    });

  }

};





// Create
exports.createCircularApproval = async (req, res) => {
  try {
    await circularApprovalModel.createCircularApproval(req.body);
    res.status(201).json({ message: "Circular approval created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create circular approval" });
  }
};

// Update
exports.updateCircularApproval = async (req, res) => {
  const { id } = req.params;
  try {
    await circularApprovalModel.updateCircularApproval(id, req.body);
    res.json({ message: "Circular approval updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update circular approval" });
  }
};

// Delete
exports.deleteCircularApproval = async (req, res) => {
  const { id } = req.params;
  try {
    await circularApprovalModel.deleteCircularApproval(id);
    res.json({ message: "Circular approval deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete circular approval" });
  }
};

exports.markAsSeen= async(req, res)=> {
    const { circularId,approverId } = req.params;
    // const approverId = req.employee.id; // from JWT token middleware
    console.log(approverId,'approverId')

    try {
      const result = await circularApprovalModel.markAsSeen(circularId, approverId);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ 
          success: false,
          message: 'Approval record not found or already marked as seen' 
        });
      }

      res.json({ 
        success: true, 
        message: 'Circular marked as seen',
        seen_at: new Date()
      });
    } catch (error) {
      console.error('Error marking circular as seen:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error updating seen status',
        error: error.message 
      });
    }
  }

 exports.approve = async(req, res) => {
    // const { circularId, approverId } = req.params;

    // try {
    //   const result = await circularApprovalModel.approve(circularId, approverId);
      
    //   if (result.affectedRows === 0) {
    //     return res.status(404).json({ 
    //       success: false,
    //       message: 'Approval record not found' 
    //     });
    //   }

    //   const [circularRows] = await circularModel.getCircularById(circularId);
    //   const circular = circularRows[0];
      
    //   const [approverRows] = await employeeModel.getEmployeeById(approverId);
    //   const approver = approverRows[0];

    //   const io = req.app.get('io');
      
    //   // Emit socket event to approver
    //   emitCircularUpdate(req, approverId, 'circular-status-updated', {
    //     circular_id: circularId,
    //     status: 'APPROVED',
    //     message: 'Circular has been approved'
    //   });
      
    //   // 1️⃣ Notify creator
    //   if (io && circular.creator_employee_id) {
    //     const notificationId = await notificationModel.createNotification({
    //       circular_id: circularId,
    //       recipient_employee_id: circular.creator_employee_id,
    //       sender_employee_id: approverId,
    //       notification_type: 'message',
    //       message_preview: `Your circular "${circular.title}" has been approved`,
    //       redirect_to: 'details'
    //     });

    //     // ✅ Emit notification to creator
    //     io.to(`notifications-${circular.creator_employee_id}`).emit('new-notification', {
    //       notification_id: notificationId,
    //       circular_id: circularId,
    //       sender_first_name: approver.first_name,
    //       sender_last_name: approver.last_name,
    //       notification_type: 'message',
    //       message_preview: `Your circular "${circular.title}" has been approved`,
    //       circular_title: circular.title,
    //       circular_code: circular.circular_code,
    //       redirect_to: 'details'
    //     });
    //   } // 👈 Close the creator notification block HERE

    //   // 2️⃣ Notify all employees with access (OUTSIDE the creator block)
    //   const [visibleEmployees] = await circularVisibilityModel.getEmployeesByCircularId(circularId);

    //   if (visibleEmployees && visibleEmployees.length > 0) {
    //     // Filter out creator to avoid duplicate notification
    //     const employeesToNotify = visibleEmployees.filter(
    //       emp => emp.employee_id !== circular.creator_employee_id
    //     );

    //     // 3️⃣ Create notifications for all employees
    //     for (const emp of employeesToNotify) {
    //       const notificationId = await notificationModel.createNotification({
    //         circular_id: circularId,
    //         recipient_employee_id: emp.employee_id,
    //         sender_employee_id: approverId,
    //         notification_type: 'message',
    //         message_preview: `New circular "${circular.title}" has been approved and is now available`,
    //         redirect_to: 'details'
    //       });

    //       // 4️⃣ Emit socket event to each employee
    //       if (io) {
    //         io.to(`notifications-${emp.employee_id}`).emit('new-notification', {
    //           notification_id: notificationId,
    //           circular_id: circularId,
    //           sender_first_name: approver.first_name,
    //           sender_last_name: approver.last_name,
    //           notification_type: 'message',
    //           message_preview: `New circular "${circular.title}" has been approved and is now available`,
    //           circular_title: circular.title,
    //           circular_code: circular.circular_code,
    //           redirect_to: 'details'
    //         });
    //       }
    //     }
    //   }

    //   res.json({ 
    //     success: true, 
    //     message: 'Circular approved successfully'
    //   });
    // } catch (error) {
    //   console.error('Error approving circular:', error);
    //   res.status(500).json({ 
    //     success: false,
    //     message: 'Error approving circular',
    //     error: error.message 
    //   });
    // } 
    const { circularId, approverId } = req.params;

  try {
    // Approve current approver only
    const result = await circularApprovalModel.approve(
      circularId,
      approverId
    ); 




    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: 'Approval record not found or already processed'
      }); 

    } 

//Audit service log for approval action
await auditService.logAudit({
  circularId: circularId,
  action: "CIRCULAR_APPROVED",
  performedBy: approverId,
  targetEmployeeId: approverId,
  oldStatus: "PENDING_APPROVAL",
  newStatus: result.allApproved ? "APPROVED" : "PENDING_APPROVAL",
  description: result.allApproved
    ? `Approver ${approverId} approved the circular. All approvers have approved.`
    : `Approver ${approverId} approved the circular. ${result.pendingCount} approval(s) still pending.`
});




eventEmitter.emit("CIRCULAR_APPROVED", {
  circularId,
  approverId,
});





    // Get circular
    const [circularRows] =
      await circularModel.getCircularById(circularId);

    const circular = circularRows[0];

    // Get current approver
    const [approverRows] =
      await employeeModel.getEmployeeById(approverId);

    const approver = approverRows[0];

    const io = req.app.get('io');

    // Update current approver UI
    emitCircularUpdate(
      req,
      approverId,
      'circular-status-updated',
      {
        circular_id: circularId,
        approval_status: 'APPROVED',
        circular_status:
          result.allApproved
            ? 'APPROVED'
            : 'PENDING_APPROVAL',
        message: result.allApproved
          ? 'Circular has been fully approved'
          : `Your approval was recorded. ${result.pendingCount} approval(s) still pending.`
      }
    );

    // ========================================
    // CASE 1: MORE APPROVERS ARE STILL PENDING
    // ========================================

    if (!result.allApproved) {

           eventEmitter.emit("CIRCULAR_PARTIALLY_APPROVED", {
  circularId,
  approverId,
  pendingCount: result.pendingCount,
});


      // Notify creator about progress
      if (circular.creator_employee_id) {

        const notificationId =
          await notificationModel.createNotification({
            circular_id: circularId,
            recipient_employee_id:
              circular.creator_employee_id,
            sender_employee_id: approverId,
            notification_type: 'message',
            message_preview:
              `${approver.first_name} ${approver.last_name} approved "${circular.title}". ` +
              `${result.pendingCount} approval(s) still pending.`,
            redirect_to: 'details'
          });

        if (io) {
          io.to(
            `notifications-${circular.creator_employee_id}`
          ).emit('new-notification', {
            notification_id: notificationId,
            circular_id: circularId,
            sender_first_name: approver.first_name,
            sender_last_name: approver.last_name,
            notification_type: 'message',
            message_preview:
              `${approver.first_name} ${approver.last_name} approved "${circular.title}". ` +
              `${result.pendingCount} approval(s) still pending.`,
            circular_title: circular.title,
            circular_code: circular.circular_code,
            redirect_to: 'details'
          });
        }
      }

      // Return here.
      // Do NOT notify normal employees yet.
      return res.json({
        success: true,
        allApproved: false,
        pendingCount: result.pendingCount,
        circularStatus: 'PENDING_APPROVAL',
        message:
          `Approval recorded successfully. ` +
          `${result.pendingCount} approval(s) still pending.`
      }); 
      
    } 
 
 






    // ========================================
    // CASE 2: ALL APPROVERS HAVE APPROVED
    // ========================================

    // Notify creator
    if (circular.creator_employee_id) {

      const notificationId =
        await notificationModel.createNotification({
          circular_id: circularId,
          recipient_employee_id:
            circular.creator_employee_id,
          sender_employee_id: approverId,
          notification_type: 'message',
          message_preview:
            `Your circular "${circular.title}" has been approved by all approvers and published.`,
          redirect_to: 'details'
        });

      if (io) {
        io.to(
          `notifications-${circular.creator_employee_id}`
        ).emit('new-notification', {
          notification_id: notificationId,
          circular_id: circularId,
          sender_first_name: approver.first_name,
          sender_last_name: approver.last_name,
          notification_type: 'message',
          message_preview:
            `Your circular "${circular.title}" has been approved by all approvers and published.`,
          circular_title: circular.title,
          circular_code: circular.circular_code,
          redirect_to: 'details'
        });
      }
    }


    // Notify employees ONLY after final approval 
    //MOVE TO RULE ENGINE

    // const [visibleEmployees] =
    //   await circularVisibilityModel
    //     .getEmployeesByCircularId(circularId);

    // if (visibleEmployees?.length > 0) {

    //   const employeesToNotify =
    //     visibleEmployees.filter(
    //       emp =>
    //         emp.employee_id !==
    //         circular.creator_employee_id
    //     );

    //   for (const emp of employeesToNotify) {

    //     const notificationId =
    //       await notificationModel.createNotification({
    //         circular_id: circularId,
    //         recipient_employee_id: emp.employee_id,
    //         sender_employee_id: approverId,
    //         notification_type: 'message',
    //         message_preview:
    //           `New circular "${circular.title}" has been fully approved and is now available.`,
    //         redirect_to: 'details'
    //       });

    //     if (io) {
    //       io.to(
    //         `notifications-${emp.employee_id}`
    //       ).emit('new-notification', {
    //         notification_id: notificationId,
    //         circular_id: circularId,
    //         sender_first_name: approver.first_name,
    //         sender_last_name: approver.last_name,
    //         notification_type: 'message',
    //         message_preview:
    //           `New circular "${circular.title}" has been fully approved and is now available.`,
    //         circular_title: circular.title,
    //         circular_code: circular.circular_code,
    //         redirect_to: 'details'
    //       });
    //     }
    //   }
    // }

eventEmitter.emit("CIRCULAR_FULLY_APPROVED", {
  circularId,
  approverId,
  io
});

// eventEmitter.emit("CIRCULAR_FULLY_APPROVED", {
//   circularId,
// });

    return res.json({
      success: true,
      allApproved: true,
      pendingCount: 0,
      circularStatus: 'APPROVED',
      message:
        'All approvers have approved the circular. Circular is now published.'
    });

  } catch (error) {

    console.error(
      'Error approving circular:',
      error
    ); 


    return res.status(500).json({
      success: false,
      message: 'Error approving circular',
      error: error.message
    }); 
    

  }

  }
 



  exports.reject=async(req, res)=> {
    const { circularId,approverId } = req.params;
    const { comments } = req.body;
    // Validate comments
    if (!comments || comments.trim() === '') {
      return res.status(400).json({ 
        success: false,
        message: 'Rejection comment is required' 
      });
    }

    try {
      const result = await circularApprovalModel.reject(circularId, approverId, comments);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ 
          success: false,
          message: 'Approval record not found' 
        }); 

      
      }  



// AUDIT LOG for rejection action 
await auditService.logAudit({
  circularId: circularId,
  action: "CIRCULAR_REJECTED",
  performedBy: approverId,
  targetEmployeeId: approverId,
  oldStatus: "PENDING_APPROVAL",
  newStatus: "REJECTED",
  description: `Circular rejected by approver ${approverId}. Reason: ${comments}`
});







  eventEmitter.emit("CIRCULAR_REJECTED", {
  circularId,
  approverId,
  comments,
  io: req.app.get('io'),
});

      emitCircularUpdate(req, approverId, 'circular-status-updated', {
      circular_id: circularId,
      status: 'REJECTED',
      message: 'Circular has been rejected'
    });

    if (false && io && circular.creator_employee_id) {
      const notificationId = await notificationModel.createNotification({
        circular_id: circularId,
        recipient_employee_id: circular.creator_employee_id,
        sender_employee_id: approverId,
        notification_type: 'message',
        message_preview: `Your circular "${circular.title}" has been rejected`,
        redirect_to: 'details'
      });

      // ✅ Emit notification to creator
      io.to(`notifications-${circular.creator_employee_id}`).emit('new-notification', {
        notification_id: notificationId,
        circular_id: circularId,
        sender_first_name: approver.first_name,
        sender_last_name: approver.last_name,
        notification_type: 'message',
        message_preview: `Your circular "${circular.title}" has been rejected. Reason: ${comments}`,
        circular_title: circular.title,
        circular_code: circular.circular_code,
        redirect_to: 'details'
      });
    }

      res.json({ 
        success: true, 
        message: 'Circular rejected successfully'
      });
    } catch (error) {
      console.error('Error rejecting circular:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error rejecting circular',
        error: error.message 
      });
    }
  }

  exports.getAssignedCirculars=async(req, res) =>{
    try {
      const {approver_id} = req.params; // Assuming user info is in req.user from auth middleware
      const filters = {
        status: req.query.status, // PENDING, APPROVED, REJECTED
        has_seen: req.query.has_seen === 'true' ? true : req.query.has_seen === 'false' ? false : undefined,
        circular_status: req.query.circular_status, // DRAFT, PENDING_APPROVAL, etc.
        limit: req.query.limit || 100,
        offset: req.query.offset || 0
      };
      
      const circulars = await circularApprovalModel.getAssignedCirculars(approver_id, filters);
      // const total = await CircularApprovalModel.getAssignedCircularsCount(employeeId, filters);
      res.status(200).json({
        success: true,
        data: circulars,
      });
    } catch (error) {
      console.error('Error fetching assigned circulars:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch assigned circulars',
        error: error.message
      });
    }
  }
