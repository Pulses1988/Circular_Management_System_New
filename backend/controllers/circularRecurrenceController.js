const circularRecurrenceModel = require("../models/circularRecurrenceModel");
const circularCompletionModel = require("../models/circularCompletionModel");
const circularTrackingModel = require("../models/circularTrackingModel");
const circularVisibilityModel = require("../models/circularVisibilityModel");
const notificationModel = require("../models/notificationModel");
const db = require("../config/db");

// Complete current cycle and prepare for next
exports.completeCycleAndRenew = async (req, res) => {
  try {
    const { circular_id, completed_by_employee_id, reference_number, submission_mode, completion_notes } = req.body;

    // Get circular details
    const [circularRows] = await db.query(
      `SELECT c.*, rc.duration_days, crl.cycle_number, crl.cycle_start_date, crl.cycle_end_date
       FROM circulars c
       JOIN repeat_cycles rc ON c.repeat_cycle_id = rc.id
       LEFT JOIN circular_recurrence_log crl ON c.id = crl.circular_id AND crl.status = 'ACTIVE'
       WHERE c.id = ?`,
      [circular_id]
    );

    if (circularRows.length === 0) {
      return res.status(404).json({ error: "Circular not found" });
    }

    const circular = circularRows[0];
    const currentCycleNumber = circular.cycle_number || 1;
    const cycleStartDate = circular.cycle_start_date || circular.published_at;
    const cycleEndDate = circular.cycle_end_date || new Date();

    // 1. Save completion for current cycle
    await circularCompletionModel.createCompletion({
      circular_id,
      completed_by_employee_id,
      reference_number,
      submission_mode,
      completion_notes,
      cycle_start_date: cycleStartDate,
      cycle_end_date: cycleEndDate,
      cycle_number: currentCycleNumber
    });

    // 2. Mark current cycle as completed
    await circularRecurrenceModel.completeCurrentCycle(circular_id, currentCycleNumber);

    // 3. Update circular status to COMPLETED
    await db.query(
      `UPDATE circulars SET status = 'COMPLETED' WHERE id = ?`,
      [circular_id]
    );

    // 4. Calculate next cycle dates
    const nextCycleNumber = currentCycleNumber + 1;
    const nextStartDate = new Date();
    const nextEndDate = new Date();
    nextEndDate.setDate(nextEndDate.getDate() + circular.duration_days);

    // 5. Create new recurrence log for next cycle
    await circularRecurrenceModel.createRecurrenceLog({
      circular_id,
      cycle_number: nextCycleNumber,
      cycle_start_date: nextStartDate.toISOString().split('T')[0],
      cycle_end_date: nextEndDate.toISOString().split('T')[0]
    });

    // 6. Update circular for next cycle
    await db.query(
      `UPDATE circulars 
       SET status = 'APPROVED',
           current_cycle_number = ?,
           last_recurrence_date = CURDATE(),
           next_recurrence_date = ?
       WHERE id = ?`,
      [nextCycleNumber, nextEndDate.toISOString().split('T')[0], circular_id]
    );

    // 7. Reset tracking for all employees (mark as not completed for new cycle)
    await db.query(
      `UPDATE circular_tracking 
       SET is_completed = FALSE, completed_at = NULL
       WHERE circular_id = ?`,
      [circular_id]
    );

    // 8. Send notifications to all employees
    const io = req.app.get('io');
    if (io) {
      const recipientEmployees = await circularVisibilityModel.getEmployeesByCircular(circular_id);
      
      for (const recipient of recipientEmployees) {
        const notificationId = await notificationModel.createNotification({
          circular_id,
          recipient_employee_id: recipient.employee_id,
          sender_employee_id: completed_by_employee_id,
          notification_type: 'message',
          message_preview: `Circular "${circular.title}" - New cycle ${nextCycleNumber} started. Please submit compliance.`,
          redirect_to: 'details'
        });

        io.to(`notifications-${recipient.employee_id}`).emit('new-notification', {
          notification_id: notificationId,
          circular_id,
          notification_type: 'message',
          message_preview: `Circular "${circular.title}" - New cycle ${nextCycleNumber} started`,
          circular_title: circular.title,
          circular_code: circular.circular_code,
          redirect_to: 'details'
        });
      }
    }

    res.status(200).json({
      message: "Cycle completed and renewed successfully",
      next_cycle_number: nextCycleNumber,
      next_cycle_end_date: nextEndDate.toISOString().split('T')[0]
    });
  } catch (error) {
    console.error("Error completing cycle:", error);
    res.status(500).json({ error: "Failed to complete cycle" });
  }
};

// Get recurrence history for a circular
exports.getRecurrenceHistory = async (req, res) => {
  try {
    const { circular_id } = req.params;
    
    const history = await circularRecurrenceModel.getRecurrenceHistory(circular_id);
    
    res.status(200).json(history);
  } catch (error) {
    console.error("Error fetching recurrence history:", error);
    res.status(500).json({ error: "Failed to fetch recurrence history" });
  }
};

// Automated job to check and renew expired cycles
exports.checkAndRenewExpiredCycles = async () => {
  try {
    const expiredCycles = await circularRecurrenceModel.getActiveRecurrences();
    
    for (const cycle of expiredCycles) {
      // Mark as expired
      await db.query(
        `UPDATE circular_recurrence_log SET status = 'EXPIRED' WHERE recurrence_id = ?`,
        [cycle.recurrence_id]
      );
      
      // Calculate next cycle
      const nextCycleNumber = cycle.cycle_number + 1;
      const nextStartDate = new Date();
      const nextEndDate = new Date();
      nextEndDate.setDate(nextEndDate.getDate() + cycle.duration_days);
      
      // Create new cycle
      await circularRecurrenceModel.createRecurrenceLog({
        circular_id: cycle.circular_id,
        cycle_number: nextCycleNumber,
        cycle_start_date: nextStartDate.toISOString().split('T')[0],
        cycle_end_date: nextEndDate.toISOString().split('T')[0]
      });
      
      // Update circular
      await db.query(
        `UPDATE circulars 
         SET status = 'APPROVED',
             current_cycle_number = ?,
             last_recurrence_date = CURDATE(),
             next_recurrence_date = ?
         WHERE id = ?`,
        [nextCycleNumber, nextEndDate.toISOString().split('T')[0], cycle.circular_id]
      );
      
      // Reset tracking
      await db.query(
        `UPDATE circular_tracking 
         SET is_completed = FALSE, completed_at = NULL
         WHERE circular_id = ?`,
        [cycle.circular_id]
      );

      const recipientEmployees = await circularVisibilityModel.getEmployeesByCircular(cycle.circular_id);
      
      for (const recipient of recipientEmployees) {
        await notificationModel.createNotification({
          circular_id: cycle.circular_id,
          recipient_employee_id: recipient.employee_id,
          sender_employee_id: null, // System generated
          notification_type: 'message',
          message_preview: `Circular "${cycle.title}" - New cycle ${nextCycleNumber} started. Please submit compliance.`,
          redirect_to: 'details'
        });
      }
      
      console.log(`✅ Renewed cycle for circular ${cycle.circular_id}, cycle ${nextCycleNumber}`);
    }
    
    return { renewed: expiredCycles.length };
  } catch (error) {
    console.error("Error in automated renewal:", error);
    throw error;
  }
};