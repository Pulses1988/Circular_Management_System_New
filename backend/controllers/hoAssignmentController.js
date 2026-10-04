const hoAssignmentModel = require("../models/hoAssignmentModel");


// =========================================================
// Create HO Assignment
// =========================================================

exports.createHOAssignment = async (req, res) => {

  try {

    const {
      title,
      assignment_code,
      description,
      priority,
      due_date,
      created_by,
      employeeIds,
    } = req.body;


    // =====================================================
    // 1. Basic validation
    // =====================================================

    if (!title || !title.trim()) {

      return res.status(400).json({
        success: false,
        message: "Assignment title is required",
      });

    }


    if (!assignment_code || !assignment_code.trim()) {

      return res.status(400).json({
        success: false,
        message: "Assignment code is required",
      });

    }


    if (!created_by) {

      return res.status(400).json({
        success: false,
        message: "Creator employee ID is required",
      });

    }


    // =====================================================
    // 2. Validate selected employees
    // =====================================================

    if (
      !Array.isArray(employeeIds) ||
      employeeIds.length === 0
    ) {

      return res.status(400).json({
        success: false,
        message: "At least one employee must be selected",
      });

    }


    // =====================================================
    // 3. Clean employee IDs
    // =====================================================

    const selectedEmployeeIds = [
      ...new Set(
        employeeIds
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0)
      )
    ];


    if (selectedEmployeeIds.length === 0) {

      return res.status(400).json({
        success: false,
        message: "No valid employee IDs were selected",
      });

    }


    console.log(
      "Selected employee IDs for HO Assignment:",
      selectedEmployeeIds
    );


    // =====================================================
    // 4. Prepare assignment data
    // =====================================================

    const assignmentData = {

      assignment_code:
        assignment_code.trim(),

      title:
        title.trim(),

      description:
        description || null,

      priority:
        priority || "MEDIUM",

      due_date:
        due_date || null,

      created_by,

      status:
        "PUBLISHED",

    };


    // =====================================================
    // 5. Create HO Assignment
    // =====================================================

    const [result] =
      await hoAssignmentModel.createHOAssignment(
        assignmentData
      );


    const assignmentId =
      result.insertId;


    // =====================================================
    // 6. Create tracking records ONLY
    //    for selected employees
    // =====================================================

    await hoAssignmentModel.createTrackingEntries(
      assignmentId,
      selectedEmployeeIds
    );


    console.log(
      "HO Assignment tracking created for employees:",
      selectedEmployeeIds
    );


    // =====================================================
    // 7. Success response
    // =====================================================

    return res.status(201).json({

      success: true,

      message:
        "HO Assignment created successfully",

      assignmentId,

      assignment_code:
        assignment_code.trim(),

      assigned:
        selectedEmployeeIds.length,

    });


  } catch (error) {

    console.error(
      "Error creating HO Assignment:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Failed to create HO Assignment",

      error:
        error.message,

    });

  }

};



// =========================================================
// Get all HO Assignments
// =========================================================

exports.getAllHOAssignments = async (req, res) => {

  try {

    const [rows] =
      await hoAssignmentModel.getAllHOAssignments();


    return res.status(200).json({

      success: true,

      assignments:
        rows,

    });


  } catch (error) {

    console.error(
      "Error fetching HO Assignments:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Failed to fetch HO Assignments",

    });

  }

};



// =========================================================
// Get HO Assignment by ID
// =========================================================

exports.getHOAssignmentById = async (req, res) => {

  try {

    const {
      id
    } = req.params;


    const [rows] =
      await hoAssignmentModel.getHOAssignmentById(
        id
      );


    if (
      !rows ||
      rows.length === 0
    ) {

      return res.status(404).json({

        success: false,

        message:
          "HO Assignment not found",

      });

    }


    return res.status(200).json({

      success: true,

      assignment:
        rows[0],

    });


  } catch (error) {

    console.error(
      "Error fetching HO Assignment:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Failed to fetch HO Assignment",

    });

  }

};



// =========================================================
// Get HO Assignments for an employee
// =========================================================

exports.getAssignmentsByEmployeeId = async (req, res) => {

  try {

    const {
      employee_id
    } = req.params;


    if (!employee_id) {

      return res.status(400).json({

        success: false,

        message:
          "Employee ID is required",

      });

    }


    const [rows] =
      await hoAssignmentModel.getAssignmentsByEmployeeId(
        employee_id
      );


    return res.status(200).json({

      success: true,

      assignments:
        rows,

    });


  } catch (error) {

    console.error(
      "Error fetching employee HO Assignments:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Failed to fetch employee HO Assignments",

    });

  }

}; 

// =========================================================
// Mark HO Assignment as Read
// =========================================================

exports.markAssignmentAsSeen = async (req, res) => {

  try {

    const {
      assignment_id,
      employee_id
    } = req.body;

    // =====================================================
    // 1. Validation
    // =====================================================

    if (!assignment_id || !employee_id) {

      return res.status(400).json({

        success: false,

        message:
          "Assignment ID and Employee ID are required",

      });

    }

    // =====================================================
    // 2. Mark assignment as seen
    // =====================================================

    await hoAssignmentModel.markAssignmentAsSeen(
      assignment_id,
      employee_id
    );

    // =====================================================
    // 3. Success response
    // =====================================================

    return res.status(200).json({

      success: true,

      message:
        "HO Assignment marked as read",

    });

  } catch (error) {

    console.error(
      "Error marking HO Assignment as read:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Failed to mark HO Assignment as read",

    });

  }

};
