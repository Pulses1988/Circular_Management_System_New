const db = require("../config/db");

exports.createCircular = (data) => {
  const {
    title,
    content,
    creator_employee_id,
    pdfBuffer,
    reference_circular_id,
    circular_code,
    source_type_id,
    effective_from,
    send_type,
    repeat_cycle_id,
    status,
    published_at,
    priority,
    special_keyword,
  } = data;

  return db.query(
    `INSERT INTO circulars
      (title, content, creator_employee_id, circular_pdf, reference_circular_id, circular_code, source_type_id, effective_from, send_type,repeat_cycle_id, status, published_at, priority, special_keyword)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title,
      content,
      creator_employee_id,
      pdfBuffer,
      reference_circular_id,
      circular_code,
      source_type_id,
      effective_from,
      send_type,
      repeat_cycle_id,
      status,
      published_at,
      priority,
      special_keyword,
    ]
  );
};

exports.getAllCirculars = () => {
  return db.query(`
    SELECT c.*, 
           e.first_name AS creator_name,
           st.name AS source_type
    FROM circulars c
    JOIN employees e ON c.creator_employee_id = e.id
    JOIN source_types st ON c.source_type_id = st.id
    ORDER BY c.created_at DESC
  `);
};

exports.getCircularById = (id) => {
  return db.query(
    `
    SELECT c.*, 
           e.first_name AS creator_name,
           st.name AS source_type
    FROM circulars c
    JOIN employees e ON c.creator_employee_id = e.id
    JOIN source_types st ON c.source_type_id = st.id
    WHERE c.id = ?
  `,
    [id]
  );
};

// get circular by the creater id

exports.getCircularByCreaterId = (createrId) => {
  return db.query(
    `SELECT 
        c.*,  -- all circular fields
        st.name AS source_type_name,  -- source type
        rc.name AS repeat_cycle_name, -- repeat cycle
        rc.duration_days AS repeat_cycle_duration, -- optional

        e.first_name AS creator_first_name,
        e.middle_name AS creator_middle_name,
        e.last_name AS creator_last_name,
        e.email AS creator_email,

        a.id AS approval_id,
        a.status AS approval_status,
        a.comments,
        a.updated_at AS approval_updated_at,

        ae.first_name AS approver_first_name,
        ae.middle_name AS approver_middle_name,
        ae.last_name AS approver_last_name,
        ae.email AS approver_email

     FROM circulars c
     JOIN employees e ON c.creator_employee_id = e.id
     LEFT JOIN circular_approvals a ON c.id = a.circular_id
     LEFT JOIN employees ae ON a.approver_id = ae.id
     LEFT JOIN source_types st ON c.source_type_id = st.id
     LEFT JOIN repeat_cycles rc ON c.repeat_cycle_id = rc.id
     WHERE c.creator_employee_id = ?
     ORDER BY c.created_at DESC, a.updated_at DESC`,
    [createrId]
  );
};

// ✅ Update Circular
exports.updateCircular = (id, data) => {
  const {
    title,
    content,
    reference_circular_id,
    circular_code,
    source_type_id,
    effective_from,
    send_type,
    repeat_cycle_id,
    status,
    published_at,
    priority,
    special_keyword,
    pdfBuffer,
  } = data;

  const sql = `
    UPDATE circulars
    SET title = ?,
        content = ?,
        reference_circular_id = ?,
        circular_code = ?,
        source_type_id = ?,
        effective_from = ?,
        send_type = ?,
        repeat_cycle_id = ?,
        status = ?,
        published_at = ?,
        priority = ?,
        special_keyword = ?,
        circular_pdf = COALESCE(?, circular_pdf)
    WHERE id = ?
  `;

  const values = [
    title,
    content,
    reference_circular_id,
    circular_code,
    source_type_id,
    effective_from,
    send_type,
    repeat_cycle_id,
    status,
    published_at,
    priority,
    special_keyword,
    pdfBuffer, // will only update if file is provided
    id,
  ];

  return db.query(sql, values);
};

// ✅ Delete Circular
exports.deleteCircular = async (req, res) => {
  try {
    const [result] = await circularModal.deleteCircular(req.params.id);
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Circular not found" });

    res.json({ message: "Circular deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete circular" });
  }
};

exports.getAllCircularsByEmployeeIdWithTrackingDetails = async (employeeId) => {
  const [rows] = await db.query(
    `
   SELECT 
      c.id AS circular_id,
      c.title,
      c.content,
      c.effective_from,
      c.published_at,
      c.status AS circular_status,
      c.circular_code,

      ct.track_id AS tracking_id,
      ct.is_seen,
      ct.seen_at,
      ct.is_completed,
      ct.completed_at,

      e.id AS creator_employee_id,
      CONCAT(e.first_name, ' ', e.last_name) AS creator_name,
      d.id AS department_id,
      d.name AS department_name,
      b.id AS branch_id,
      b.name AS branch_name

    FROM circular_tracking ct
    JOIN circulars c ON ct.circular_id = c.id
    LEFT JOIN employees e ON c.creator_employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN branches b ON e.branch_id = b.id
    WHERE ct.employee_id = ?
    ORDER BY c.published_at DESC
    `,
    [employeeId]
  );
  return rows;
};

exports.getCircularDetailsById = async (circularId)=>{
// 1️⃣ Fetch main circular details + creator info + department + branch
  const [circularRows] = await db.query(`
    SELECT 
      c.id,
      c.title,
      c.content,
      c.circular_pdf,
      c.circular_code,
      c.effective_from,
      c.send_type,
      c.status,
      c.published_at,
      c.reference_circular_id,
      e.first_name AS creator_first_name,
      e.last_name AS creator_last_name,
      d.name AS department_name,
      b.name AS branch_name
    FROM circulars c
    LEFT JOIN employees e ON c.creator_employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN branches b ON e.branch_id = b.id
    WHERE c.id = ?
  `, [circularId]);

  if (circularRows.length === 0) return null;
  const circular = circularRows[0];

  // 2️⃣ Fetch approved approvers (names)
  const [approverRows] = await db.query(`
    SELECT 
      ca.approver_id,
      e.first_name,
      e.last_name
    FROM circular_approvals ca
    JOIN employees e ON ca.approver_id = e.id
    WHERE ca.circular_id = ? AND ca.status = 'APPROVED'
  `, [circularId]);

  circular.approvers = approverRows;

  // 3️⃣ Fetch reference circular info (if exists)
  if (circular.reference_circular_id) {
    const [refRows] = await db.query(`
      SELECT id, title, circular_code
      FROM circulars
      WHERE id = ?
    `, [circular.reference_circular_id]);
    circular.reference_circular = refRows[0] || null;
  } else {
    circular.reference_circular = null;
  }

  // 4️⃣ Fetch tracking stats (seen & completed counts)
  const [trackingStats] = await db.query(`
    SELECT 
      SUM(CASE WHEN is_seen = TRUE THEN 1 ELSE 0 END) AS seen_count,
      SUM(CASE WHEN is_completed = TRUE THEN 1 ELSE 0 END) AS completed_count,
      COUNT(*) AS total_count
    FROM circular_tracking
    WHERE circular_id = ?
  `, [circularId]);

  circular.tracking = trackingStats[0];

  // 5️⃣ Fetch chats + sender names
  const [chatRows] = await db.query(`
    SELECT 
      cc.chat_id,
      cc.employee_id,
      cc.message,
      cc.created_at,
      e.first_name,
      e.last_name
    FROM circular_chats cc
    JOIN employees e ON cc.employee_id = e.id
    WHERE cc.circular_id = ?
    ORDER BY cc.created_at ASC
  `, [circularId]);

  circular.chats = chatRows;

  return circular;
}