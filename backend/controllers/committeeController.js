const XLSX = require("xlsx");
const committeeModel = require("../models/committeeModel");

/**
 * Create Committee
 */
exports.createCommittee = async (req, res) => {
  try {
    const memberTypeIds = getMemberTypeIds(req.body);
    const result = await committeeModel.createCommitteeWithMemberTypes(
      req.body,
      memberTypeIds
    );

    res.status(201).json({
      success: true,
      message: "Committee created successfully",
      committeeId: result.insertId,
    });
  } catch (err) {
    console.error("Create Committee Error:", err);
    res.status(err.statusCode || 500).json({
      success: false,
      message: "Failed to create committee",
      error: err.message,
    });
  }
};

/**
 * Get All Committees
 */
exports.getAllCommittees = async (req, res) => {
  try {
    const [rows] = await committeeModel.getAllCommittees();

    res.status(200).json(rows);
  } catch (err) {
    console.error("Get Committees Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch committees",
      error: err.message,
    });
  }
};

/**
 * Get Committee By ID
 */
exports.getCommitteeById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await committeeModel.getCommitteeById(id);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Committee not found",
      });
    }

    const [memberTypeRows] = await committeeModel.getCommitteeMemberTypeIds(id);

    res.status(200).json({
      ...rows[0],
      member_type_ids: memberTypeRows.map((row) => row.member_type_id),
    });
  } catch (err) {
    console.error("Get Committee Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch committee",
      error: err.message,
    });
  }
};

/**
 * Get only employees whose role is allowed for the selected committee.
 */
exports.getEligibleCommitteeEmployees = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await committeeModel.getEligibleCommitteeEmployees(id);

    res.status(200).json(rows);
  } catch (err) {
    console.error("Get Eligible Committee Employees Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch eligible committee employees",
      error: err.message,
    });
  }
};

/**
 * Update Committee
 */
exports.updateCommittee = async (req, res) => {
  try {
    const { id } = req.params;

    if (Object.prototype.hasOwnProperty.call(req.body, "member_type_ids")) {
      const memberTypeIds = getMemberTypeIds(req.body);
      await committeeModel.updateCommitteeWithMemberTypes(id, req.body, memberTypeIds);
    } else {
      await committeeModel.updateCommittee(id, req.body);
    }

    res.status(200).json({
      success: true,
      message: "Committee updated successfully",
    });
  } catch (err) {
    console.error("Update Committee Error:", err);
    res.status(err.statusCode || 500).json({
      success: false,
      message: "Failed to update committee",
      error: err.message,
    });
  }
};

function getMemberTypeIds(data) {
  if (data.member_type_ids === undefined) {
    return [];
  }

  if (!Array.isArray(data.member_type_ids)) {
    const error = new Error("member_type_ids must be an array");
    error.statusCode = 400;
    throw error;
  }

  return [...new Set(data.member_type_ids.map(Number))].filter(
    (id) => Number.isInteger(id) && id > 0
  );
}

/**
 * Delete Committee
 */
exports.deleteCommittee = async (req, res) => {
  try {
    const { id } = req.params;

    await committeeModel.deleteCommittee(id);

    res.status(200).json({
      success: true,
      message: "Committee deleted successfully",
    });
  } catch (err) {
    console.error("Delete Committee Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete committee",
      error: err.message,
    });
  }
};

/**
 * ============================================
 * COMMITTEE MEMBER OPERATIONS
 * ============================================
 */

/**
 * Get Committee Members
 */
// exports.getCommitteeMembers = async (req, res) => {
//   try {
//     const { id } = req.params;
//     console.log("Committee ID:", id);
//     const [rows] = await committeeModel.getCommitteeMembers(id);
// console.log("Rows from DB:", rows);
//     res.status(200).json(rows);
//   } catch (err) {
//     console.error("Get Committee Members Error:", err);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch committee members",
//       error: err.message,
//     });
//   }
// };

exports.getCommitteeMembers = async (req, res) => {
  try {
    console.log("req.params =", req.params);

    const committeeId = req.params.id;

    console.log("Committee ID =", committeeId);

    const [rows] = await committeeModel.getCommitteeMembers(committeeId);

    console.log("Rows =", rows);

    res.status(200).json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
};







/**
 * Remove Committee Member
 */
exports.removeCommitteeMember = async (req, res) => {
  try {
    const { id } = req.params;

    await committeeModel.removeCommitteeMember(id);

    res.status(200).json({
      success: true,
      message: "Committee member removed successfully",
    });
  } catch (err) {
    console.error("Remove Committee Member Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to remove committee member",
      error: err.message,
    });
  }
};

/**
 * Get Employee Committees
 */
exports.getEmployeeCommittees = async (req, res) => {
  try {
    const { employee_id } = req.params;

    const [rows] = await committeeModel.getEmployeeCommittees(
      employee_id
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error("Get Employee Committees Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch employee committees",
      error: err.message,
    });
  }
};   


// Supports the existing employee_id payload and the new employee_ids array.
exports.addCommitteeMember = async (req, res) => {
  try {
    const committeeId = Number(req.body.committee_id);
    const requestedEmployeeIds = req.body.employee_ids === undefined
      ? [req.body.employee_id]
      : req.body.employee_ids;

    if (!Number.isInteger(committeeId) || committeeId <= 0 || !Array.isArray(requestedEmployeeIds)) {
      return res.status(400).json({ success: false, message: "committee_id and employee_ids are required" });
    }

    const employeeIds = [...new Set(requestedEmployeeIds.map(Number))].filter(
      (id) => Number.isInteger(id) && id > 0
    );

    if (employeeIds.length === 0 || employeeIds.length !== requestedEmployeeIds.length) {
      return res.status(400).json({ success: false, message: "employee_ids must contain valid employee IDs" });
    }

    const assignedCount = await committeeModel.addCommitteeMembers(committeeId, employeeIds);

    res.status(201).json({
      success: true,
      message: assignedCount ? "Employees assigned successfully" : "Selected employees are already assigned",
      assignedCount,
    });
  } catch (err) {
    console.error("Add Committee Members Error:", err);
    res.status(err.statusCode || 500).json({
      success: false,
      message: "Failed to assign employees",
      error: err.message,
    });
  }
};


//new function to handle excel upload 

// Upload Excel and assign employees to committee
exports.uploadCommitteeMembersExcel = async (req, res) => {
  try {
    const committeeId = Number(req.body.committee_id);

    if (!Number.isInteger(committeeId) || committeeId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid committee_id is required"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Excel file is required"
      });
    }

    // Read Excel file
    const workbook = XLSX.read(req.file.buffer, {
      type: "buffer"
    });

    const sheetName = workbook.SheetNames[0];

    const worksheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(worksheet);

    if (!rows.length) {
      return res.status(400).json({
        success: false,
        message: "Excel file is empty"
      });
    }

    console.log("Excel rows:", rows);

    /*
      Expected Excel format:

      employee_id
      EMP001
      EMP002
      EMP003
    */

    const employeeCodes = rows
      .map(row => row.employee_id)
      .filter(value => value !== undefined && value !== null)
      .map(value => String(value).trim());

    if (employeeCodes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Excel must contain an employee_id column"
      });
    }

    // Remove duplicate employee IDs
    const uniqueEmployeeCodes = [
      ...new Set(employeeCodes)
    ];

    // Get eligible employees for this committee
    const [eligibleEmployees] =
      await committeeModel.getEligibleCommitteeEmployees(committeeId);

    console.log(
      "Eligible employees:",
      eligibleEmployees
    );

    /*
      Match Excel employee_id
      with employees who are eligible for this committee.
    */

    const eligibleMap = new Map(
      eligibleEmployees.map(emp => [
        String(emp.employee_id).trim(),
        emp.id
      ])
    );

    const employeeIds = [];

    const invalidEmployees = [];

    for (const employeeCode of uniqueEmployeeCodes) {

      const employeeDbId = eligibleMap.get(employeeCode);

      if (!employeeDbId) {
        invalidEmployees.push(employeeCode);
      } else {
        employeeIds.push(employeeDbId);
      }
    }

    // If any Excel employee is not eligible
    if (invalidEmployees.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "One or more employees are not eligible for this committee",
        invalidEmployees
      });
    }

    // Reuse your EXISTING working logic
    const assignedCount =
      await committeeModel.addCommitteeMembers(
        committeeId,
        employeeIds
      );

    return res.status(201).json({
      success: true,
      message: assignedCount
        ? "Employees assigned successfully"
        : "Selected employees are already assigned",
      assignedCount
    });

  } catch (err) {

    console.error(
      "Upload Committee Members Excel Error:",
      err
    );

    res.status(err.statusCode || 500).json({
      success: false,
      message: "Failed to upload Excel",
      error: err.message
    });
  }
};