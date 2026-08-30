const regionModel = require("../models/regionModel");

// Get All Regions
exports.getAllRegions = async (req, res) => {
  try {
    const [rows] = await regionModel.getAllRegions();
    res.json(rows);
  } catch (err) {
    console.error("Get Regions Error:", err);
    res.status(500).json({
      error: "Failed to fetch Regions",
    });
  }
};

// Get Region By ID
exports.getRegionById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await regionModel.getRegionById(id);

    if (rows.length === 0) {
      return res.status(404).json({
        error: "Region not found",
      });
    }

    res.json(rows[0]);

  } catch (err) {
    console.error("Get Region Error:", err);

    res.status(500).json({
      error: "Failed to fetch Region",
    });
  }
};

// Create Region
exports.createRegion = async (req, res) => {
  let { name, head_office_id } = req.body;

  try {

    // ============================================
    // 1. Validate input
    // ============================================

    if (!name || !head_office_id) {
      return res.status(400).json({
        error: "Region name and Head Office are required."
      });
    }

    // Remove extra spaces
    name = name.trim();

    // ============================================
    // 2. Check duplicate Region
    // ============================================

    const [existing] = await regionModel.checkRegionExists(
      name,
      head_office_id
    );

    if (existing.length > 0) {
      return res.status(400).json({
        error: "Region already exists under this Head Office."
      });
    }

    // ============================================
    // 3. Create Region
    // ============================================

    const [result] = await regionModel.createRegion({
      name,
      head_office_id,
    });

    // ============================================
    // 4. Return created Region
    // ============================================

    const [rows] = await regionModel.getRegionById(result.insertId);

    res.status(201).json(rows[0]);

  } catch (err) {

    console.error("Create Region Error:", err);

    // Handle database duplicate error
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        error: "Region already exists under this Head Office."
      });
    }

    res.status(500).json({
      error: "Failed to create Region",
    });

  }
};

// Delete Region
exports.deleteRegion = async (req, res) => {

  const { id } = req.params;

  try {

    await regionModel.deleteRegion(id);

    res.json({
      message: "Region deleted successfully",
    });

  } catch (err) {

    console.error("Delete Region Error:", err);

    res.status(500).json({
      error: "Failed to delete Region",
    });

  }

};    


//update region 

exports.updateRegion = async (req, res) => {
  const { id } = req.params;
  const { name, head_office_id } = req.body;

  try {

    // Check duplicate region except current record
    const [existing] = await regionModel.checkRegionExists(
      name,
      head_office_id,
      id
    );

    if (existing.length > 0) {
      return res.status(400).json({
        error: "Region already exists under this Head Office."
      });
    }

    await regionModel.updateRegion(id, {
      name,
      head_office_id
    });

    res.json({
      message: "Region updated successfully"
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Failed to update Region"
    });

  }
};