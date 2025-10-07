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
  } = data;

  return db.query(
    `INSERT INTO circulars
      (title, content, creator_employee_id, circular_pdf, reference_circular_id, circular_code, source_type_id, effective_from, send_type,repeat_cycle_id, status, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
exports.updateCircular = async (req, res) => {
  try {
    const data = {
      title: req.body.title,
      content: req.body.content || null,
      reference_circular_id: req.body.reference_circular_id || null,
      circular_code: req.body.circular_code,
      source_type_id: req.body.source_type_id,
      effective_from: req.body.effective_from,
      send_type: req.body.send_type,
      repeat_cycle_id: req.body.repeat_cycle_id,
      status: req.body.status,
      published_at: req.body.published_at || null,
      pdfBuffer: req.file ? req.file.buffer : null, // optional update
    };

    const [result] = await circularModal.updateCircular(req.params.id, data);
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Circular not found" });

    res.json({ message: "Circular updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update circular" });
  }
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
