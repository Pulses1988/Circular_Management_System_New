const db = require("../config/db");

// Get all circular approvals
exports.getAllCircularApprovals = () => {
  return db.query("SELECT * FROM circular_approvals");
};

// Get circular approvals with related circular and approver info
exports.getAllCircularApprovalsWithRelations = () => {
  return db.query(`
    SELECT 
      ca.id, ca.circular_id, ca.approver_id, ca.has_seen, ca.seen_at, ca.status, ca.comments, ca.updated_at,
      c.title AS circular_title, c.circular_type,
      e.first_name, e.last_name, e.email
    FROM circular_approvals ca
    LEFT JOIN circulars c ON ca.circular_id = c.id
    LEFT JOIN employees e ON ca.approver_id = e.id
  `);
};

// Get by ID
exports.getCircularApprovalById = (id) => {
  return db.query("SELECT * FROM circular_approvals WHERE id = ?", [id]);
};

exports.getcircularApprovalByEmpID=(approver_id )=>{
  return db.query("select * from circular_approvals WHERE approver_id=?",[approver_id ])
}

// Create circular approval
exports.createCircularApproval = (data) => {
  const { circular_id, approver_id, status, comments } = data;
  return db.query(
    `INSERT INTO circular_approvals 
     (circular_id, approver_id, status, comments) VALUES (?, ?, ?, ?)`,
    [circular_id, approver_id, status || "PENDING", comments || null]
  );
};

// Update circular approval
exports.updateCircularApproval = (id, data) => {
  const { has_seen, seen_at, status, comments } = data;
  return db.query(
    `UPDATE circular_approvals 
     SET has_seen = ?, seen_at = ?, status = ?, comments = ? 
     WHERE id = ?`,
    [
      has_seen || false,
      seen_at || null,
      status || "PENDING",
      comments || null,
      id,
    ]
  );
};

  exports.markAsSeen= async(circularId, approverId)=> {
    const query = `
      UPDATE circular_approvals 
      SET has_seen = TRUE, 
          seen_at = NOW() 
      WHERE circular_id = ? 
        AND approver_id = ?
        AND has_seen = FALSE
    `;
    
    try {
      const [result] = await db.query(query, [circularId, approverId]);
      return result;
    } catch (error) {
      throw error;
    }
  }

  exports.approve= async (circularId, approverId)=> {
    const query = `
      UPDATE circular_approvals 
      SET status = 'APPROVED',
          updated_at = NOW()
      WHERE circular_id = ? 
        AND approver_id = ?
    `;
    
    try {
      const [result] = await db.query(query, [circularId, approverId]);
      
      // Also update circular status to APPROVED
      await db.query(
        'UPDATE circulars SET status = "APPROVED", published_at = NOW() WHERE id = ?',
        [circularId]
      );
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  exports.reject=async(circularId, approverId, comments) =>{
    const query = `
      UPDATE circular_approvals 
      SET status = 'REJECTED',
          comments = ?,
          updated_at = NOW()
      WHERE circular_id = ? 
        AND approver_id = ?
    `;
    
    try {
      const [result] = await db.query(query, [comments, circularId, approverId]);
      
      // Also update circular status to REJECTED
      await db.query(
        'UPDATE circulars SET status = "REJECTED" WHERE id = ?',
        [circularId]
      );
      
      return result;
    } catch (error) {
      throw error;
    }
  }

// Delete circular approval
exports.deleteCircularApproval = (id) => {
  return db.query("DELETE FROM circular_approvals WHERE id = ?", [id]);
};


exports.getAssignedCirculars=async(approver_id, filters = {})=> {
    try {
      let query = `
        SELECT 
          c.id AS circular_id,
          c.title,
          c.content,
          c.circular_code,
          c.send_type,
          c.status AS circular_status,
          c.effective_from,
          c.created_at,
          c.published_at,
          ca.id AS approval_id,
          ca.has_seen,
          ca.seen_at,
          ca.status AS approval_status,
          ca.comments,
          ca.updated_at AS approval_updated_at,
          creator.id AS creator_id,
         
          st.id AS source_type_id,
          st.name AS source_type_name
        FROM circular_approvals ca
        INNER JOIN circulars c ON ca.circular_id = c.id
        INNER JOIN employees creator ON c.creator_employee_id = creator.id
        LEFT JOIN source_types st ON c.source_type_id = st.id
        WHERE ca.approver_id = ?
      `;
      
      const params = [approver_id];
      
      // Add filters
      if (filters.status) {
        query += ` AND ca.status = ?`;
        params.push(filters.status);
      }
      
      if (filters.has_seen !== undefined) {
        query += ` AND ca.has_seen = ?`;
        params.push(filters.has_seen);
      }
      
      if (filters.circular_status) {
        query += ` AND c.status = ?`;
        params.push(filters.circular_status);
      }
      
      query += ` ORDER BY c.created_at DESC`;
      
      // Add pagination
      if (filters.limit) {
        query += ` LIMIT ?`;
        params.push(parseInt(filters.limit));
        
        if (filters.offset) {
          query += ` OFFSET ?`;
          params.push(parseInt(filters.offset));
        }
      }
      
      const [rows] = await db.query(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }