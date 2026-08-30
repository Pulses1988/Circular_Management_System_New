const settingsModel = require("../models/settingsModel");

// GET max approvers
exports.getMaxApprovers = async (req, res) => {
  try {
    const [rows] = await settingsModel.getMaxApprovers();

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Max approver setting not found"
      });
    }

    res.status(200).json({
      success: true,
      maxApprovers: Number(rows[0].setting_value)
    });

  } catch (error) {
    console.error("Error getting max approvers:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get max approvers"
    });
  }
};


// UPDATE max approvers
exports.updateMaxApprovers = async (req, res) => {
  try {
    const { maxApprovers } = req.body;

    if (!maxApprovers || maxApprovers < 1) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid number of approvers"
      });
    }

    await settingsModel.updateMaxApprovers(maxApprovers);

    res.status(200).json({
      success: true,
      message: "Maximum approvers updated successfully",
      maxApprovers: Number(maxApprovers)
    });

  } catch (error) {
    console.error("Error updating max approvers:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update max approvers"
    });
  }
};