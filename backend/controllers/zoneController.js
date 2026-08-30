const zoneModel = require("../models/zoneModel");

// Get All Zones
exports.getAllZones = async (req, res) => {
  try {
    const [rows] = await zoneModel.getAllZones();
    res.json(rows);
  } catch (err) {
    console.error("Get All Zones Error:", err);
    res.status(500).json({
      error: "Failed to fetch Zones",
    });
  }
};

// Get Zone By ID
exports.getZoneById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await zoneModel.getZoneById(id);

    if (rows.length === 0) {
      return res.status(404).json({
        error: "Zone not found",
      });
    }

    res.json(rows[0]);

  } catch (err) {
    console.error("Get Zone Error:", err);
    res.status(500).json({
      error: "Failed to fetch Zone",
    });
  }
};

// Create Zone
exports.createZone = async (req, res) => {
  try {

    const { name, region_id } = req.body;

    // Check duplicate
    const [existing] = await zoneModel.checkZoneExists(
      name,
      region_id
    );

    if (existing.length > 0) {
      return res.status(400).json({
        error: "Zone already exists in this Region."
      });
    }

    const [result] = await zoneModel.createZone({
      name,
      region_id,
    });

    const [rows] = await zoneModel.getZoneById(
      result.insertId
    );

    res.status(201).json(rows[0]);

  } catch (err) {
    console.error("Create Zone Error:", err);

    res.status(500).json({
      error: "Failed to create Zone",
    });
  }
};

// Delete Zone
exports.deleteZone = async (req, res) => {
  try {

    const { id } = req.params;

    await zoneModel.deleteZone(id);

    res.json({
      message: "Zone deleted successfully",
    });

  } catch (err) {
    console.error("Delete Zone Error:", err);

    res.status(500).json({
      error: "Failed to delete Zone",
    });
  }
};

// Get Zones By Region
exports.getZonesByRegionId = async (req, res) => {
  try {

    const { regionId } = req.params;

    const [rows] = await zoneModel.getZonesByRegionId(regionId);

    res.json(rows);

  } catch (err) {

    console.error("Get Zones By Region Error:", err);

    res.status(500).json({
      error: "Failed to fetch Zones",
    });

  }
};  

//zone update 
exports.updateZone = async (req, res) => {

  try {

    const { id } = req.params;
    const { name, region_id } = req.body;

    // Check duplicate (excluding current record)
    const [existing] = await zoneModel.checkZoneExists(
      name,
      region_id,
      id
    );

    if (existing.length > 0) {
      return res.status(400).json({
        error: "Zone already exists in this Region."
      });
    }

    await zoneModel.updateZone(id, {
      name,
      region_id
    });

    res.json({
      message: "Zone updated successfully"
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Failed to update Zone"
    });

  }

};