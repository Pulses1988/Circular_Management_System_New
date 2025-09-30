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
    repeat_cycle,
    status,
    published_at,
  } = data;

  return db.query(
    `INSERT INTO circulars
      (title, content, creator_employee_id, circular_pdf, reference_circular_id, circular_code, source_type_id, effective_from, send_type,repeat_cycle, status, published_at)
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
      repeat_cycle,
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
      repeat_cycle: req.body.repeat_cycle,
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
