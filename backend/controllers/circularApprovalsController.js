const circularApprovalModel = require("../models/circularApprovalsModel");

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

exports.getCircularApprovalByEmpId= async (req,res)=>{
  const {approver_id }= req.params;
  try{
    const[rows]= await circularApprovalModel.getcircularApprovalByEmpID(approver_id );
    if(rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  }catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch approval table data by Emp Id" });
  }
}

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

  exports.approve= async(req, res)=> {
    const { circularId,approverId } = req.params;

    try {
      const result = await circularApprovalModel.approve(circularId, approverId);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ 
          success: false,
          message: 'Approval record not found' 
        });
      }
 // Emit socket event to approver
      emitCircularUpdate(req, approverId, 'circular-status-updated', {
      circular_id: circularId,
      status: 'APPROVED',
      message: 'Circular has been approved'
    });

      res.json({ 
        success: true, 
        message: 'Circular approved successfully'
      });
    } catch (error) {
      console.error('Error approving circular:', error);
      res.status(500).json({ 
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
      emitCircularUpdate(req, approverId, 'circular-status-updated', {
      circular_id: circularId,
      status: 'REJECTED',
      message: 'Circular has been rejected'
    });

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