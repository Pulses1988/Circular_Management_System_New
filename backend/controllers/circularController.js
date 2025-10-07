const circularModal = require("../models/circularModel");
const circularApprovalModal = require("../models/circularApprovalsModel");
const circularVisibilityModal = require("../models/circularVisibilityModel");
const employeeModal = require("../models/employeesModal");

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
      const io = req.app.get("io");
      console.log("IO instance:", io ? "Available" : "Not available");
      const [circularRows] = await circularModal.getCircularById(circularId);
      const circularDetails = circularRows[0];
      console.log("Circular details fetched:", circularDetails ? "Yes" : "No");

      for (const approverId of approvers) {
        await circularApprovalModal.createCircularApproval({
          circular_id: circularId,
          approver_id: approverId,
          status: "PENDING",
        });
        if (io) {
          const roomName = `approver-${approverId}`;
          console.log(`Emitting to room: ${roomName}`);
          console.log(
            `Clients in room:`,
            io.sockets.adapter.rooms.get(roomName)?.size || 0
          );
          io.to(`approver-${approverId}`).emit("new-circular-assigned", {
            circular: circularDetails,
            message: "New circular has been assigned to you",
            circular_id: circularId,
          });
          console.log(`Socket event emitted to approver ${approverId}`);
        }
      }
    }

    // ✅ Save visibility employees
    const visiblityEmployee = req.body.visiblityEmployee
      ? JSON.parse(req.body.visiblityEmployee)
      : [];
    if (Array.isArray(visiblityEmployee) && visiblityEmployee.length > 0) {
      await circularVisibilityModal.assignToEmployees(
        circularId,
        visiblityEmployee
      );
    }

    if (req.body.send_type === "INTERNAL") {
      if (req.body.headOfficeId && req.body.departmentId) {
        const deptEmployee =
          await circularVisibilityModal.getEmployeesByDepartment(
            req.body.departmentId
          );

        if (deptEmployee.length > 0) {
          await circularVisibilityModal.assignToEmployees(
            circularId,
            deptEmployee
          );
        }
      }

      if (req.body.branchId && req.body.departmentId) {
        const branchEmployees =
          await circularVisibilityModal.getEmployeesByDepartment(
            req.body.departmentId
          );
        if (branchEmployees.length > 0) {
          await circularVisibilityModal.assignToEmployees(
            circularId,
            branchEmployees
          );
        }
      }

      if (req.body.branchId) {
        const branchDepartmentEmployees =
          await circularVisibilityModal.getEmployeesByBranch(req.body.branchId);

        if (branchDepartmentEmployees.length > 0) {
          await circularVisibilityModal.assignToEmployees(
            circularId,
            branchDepartmentEmployees
          );
        }
      }
    }

    // 4️⃣ Automatically assign all employees for PUBLIC circulars
    if (req.body.send_type === "PUBLIC") {
      const [allEmployees] = await employeeModal.getAllEmployees();
      if (allEmployees.length > 0) {
        const allEmployeeIds = allEmployees.map((e) => e.id);
        await circularVisibilityModal.assignToEmployees(
          circularId,
          allEmployeeIds
        );
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

// get circular by creater id

exports.getCircularByCreaterId = async (req, res) => {
  try {
    const [rows] = await circularModal.getCircularByCreaterId(
      req.params.createrId
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No circulars found for this creator" });
    }

    // Aggregate circulars by circular id
    const circularMap = new Map();

    rows.forEach((row) => {
      if (!circularMap.has(row.id)) {
        circularMap.set(row.id, {
          id: row.id,
          title: row.title,
          content: row.content,
          circular_code: row.circular_code,
          send_type: row.send_type,
          status: row.status,
          effective_from: row.effective_from,
          published_at: row.published_at,
          created_at: row.created_at,
          source_type_name: row.source_type_name,
          repeat_cycle_name: row.repeat_cycle_name,
          repeat_cycle_duration: row.repeat_cycle_duration,
          creator: {
            first_name: row.creator_first_name,
            middle_name: row.creator_middle_name,
            last_name: row.creator_last_name,
            email: row.creator_email,
          },
          approvals: [],
        });
      }

      // Add approval if it exists
      if (row.approval_id) {
        circularMap.get(row.id).approvals.push({
          id: row.approval_id,
          status: row.approval_status,
          comments: row.comments,
          updated_at: row.approval_updated_at,
          approver: {
            first_name: row.approver_first_name,
            middle_name: row.approver_middle_name,
            last_name: row.approver_last_name,
            email: row.approver_email,
          },
        });
      }
    });

    // Convert map to array
    const circulars = Array.from(circularMap.values());

    res.json(circulars);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch circulars" });
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
