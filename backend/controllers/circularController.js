const circularModal = require("../models/circularModel");
const circularApprovalModal = require("../models/circularApprovalsModel");

exports.createCircular = async (req, res) => {
  try {
    if (req.body.status !== "DRAFT" && !req.file)
      return res.status(400).json({ error: "PDF file is required" });

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
      repeat_cycle: req.body.repeat_cycle || "ONE_TIME",
      status: req.body.status,
      published_at: req.body.published_at || null,
    };

    const [result] = await circularModal.createCircular(data);
    const circularId = result.insertId;

    const approvers = req.body.approvers ? JSON.parse(req.body.approvers) : [];
    if (Array.isArray(approvers) && approvers.length > 0) {
      for (const approverId of approvers) {
        await circularApprovalModal.createCircularApproval({
          circular_id: circularId,
          approver_id: approverId,
          status: "PENDING",
        });
      }
    }

    res.status(201).json({ message: "Circular created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create circular" });
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
