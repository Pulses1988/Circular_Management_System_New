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

// Delete circular approval
exports.deleteCircularApproval = (id) => {
  return db.query("DELETE FROM circular_approvals WHERE id = ?", [id]);
};
