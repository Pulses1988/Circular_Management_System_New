const circularCompletionModel = require("../models/circularCompletionModel");
const db = require("../config/db");

exports.completeCircular = async (req, res) => {
  try {
    const { circular_id, completed_by_employee_id, reference_number, submission_mode, completion_notes } = req.body;

    if (!circular_id || !completed_by_employee_id || !reference_number || !submission_mode) {
      return res.status(400).json({ error: "All required fields must be provided" });
    }

     const [circularRows] = await db.query(
      `SELECT is_recurring, repeat_cycle_id FROM circulars WHERE id = ?`,
      [circular_id]
    );
     const circular = circularRows[0];

     if (circular.is_recurring && circular.repeat_cycle_id) {
      return require("./circularRecurrenceController").completeCycleAndRenew(req, res);
    }

    // Create completion record
    const completionId = await circularCompletionModel.createCompletion({
      circular_id,
      completed_by_employee_id,
      reference_number,
      submission_mode,
      completion_notes
    });

    // Update circular status to COMPLETED
    await db.query(
      `UPDATE circulars SET status = 'COMPLETED' WHERE id = ?`,
      [circular_id]
    );

    res.status(201).json({
      message: "Circular marked as completed successfully",
      completion_id: completionId
    });
  } catch (error) {
    console.error("Error completing circular:", error);
    res.status(500).json({ error: "Failed to complete circular" });
  }
};

exports.getCompletionDetails = async (req, res) => {
  try {
    const { circular_id } = req.params;
    
    const completions = await circularCompletionModel.getCompletionByCircular(circular_id);
    
    res.status(200).json(completions);
  } catch (error) {
    console.error("Error fetching completion details:", error);
    res.status(500).json({ error: "Failed to fetch completion details" });
  }
};