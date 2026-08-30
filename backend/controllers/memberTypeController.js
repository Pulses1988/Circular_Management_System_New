const memberTypeModel = require("../models/memberTypeModel");

/**
 * =====================================
 * Get All Member Types
 * =====================================
 */
exports.getAllMemberTypes = async (req, res) => {
  try {
    const [rows] = await memberTypeModel.getAllMemberTypes();

    res.status(200).json({
      success: true,
      message: "Member types fetched successfully.",
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching member types:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch member types.",
      error: error.message,
    });
  }
};

/**
 * =====================================
 * Get Active Member Types
 * =====================================
 */
exports.getActiveMemberTypes = async (req, res) => {
  try {
    const [rows] = await memberTypeModel.getActiveMemberTypes();

    res.status(200).json({
      success: true,
      message: "Active member types fetched successfully.",
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching active member types:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch active member types.",
      error: error.message,
    });
  }
};

/**
 * =====================================
 * Get Member Type By ID
 * =====================================
 */
exports.getMemberTypeById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await memberTypeModel.getMemberTypeById(id);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Member type not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("Error fetching member type:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch member type.",
      error: error.message,
    });
  }
};

/**
 * =====================================
 * Create Member Type
 * =====================================
 */
exports.createMemberType = async (req, res) => {
  try {
    const { member_type_name, status } = req.body;

    if (!member_type_name) {
      return res.status(400).json({
        success: false,
        message: "Member type name is required.",
      });
    }

    const [result] = await memberTypeModel.createMemberType({
      member_type_name,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Member type created successfully.",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Error creating member type:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create member type.",
      error: error.message,
    });
  }
};

/**
 * =====================================
 * Update Member Type
 * =====================================
 */
exports.updateMemberType = async (req, res) => {
  try {
    const { id } = req.params;
    const { member_type_name, status } = req.body;

    const [result] = await memberTypeModel.updateMemberType(id, {
      member_type_name,
      status,
    });

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Member type not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Member type updated successfully.",
    });
  } catch (error) {
    console.error("Error updating member type:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update member type.",
      error: error.message,
    });
  }
};

/**
 * =====================================
 * Delete Member Type
 * =====================================
 */
exports.deleteMemberType = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await memberTypeModel.deleteMemberType(id);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Member type not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Member type deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting member type:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete member type.",
      error: error.message,
    });
  }
};