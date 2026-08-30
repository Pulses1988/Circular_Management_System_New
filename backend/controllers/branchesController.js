const branchModel = require("../models/branchesModel");

exports.getAllBranches = async (req, res) => {
  try {
    const [rows] = await branchModel.getAllBranches();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch branches" });
  }
};

exports.getAllBranchesWithHeadOffice = async (req, res) => {
  try {
    const [rows] = await branchModel.getAllBranchesWithHeadOffice();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Failed to fetch branches with head office info" });
  }
};

exports.getBranchById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await branchModel.getBranchById(id);
    if (rows.length === 0)
      return res.status(404).json({ error: "Branch not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch branch" });
  }
};

// exports.createBranch = async (req, res) => {
//   const { name, address, head_office_id,circle_id } = req.body;
//   try {
//     const [existing] = await branchModel.checkBranchNameExists(name);

//     if (existing.length > 0) {
//       return res.status(400).json({ error: "Branch name already exists." });
//     }

//     const [result] = await branchModel.createBranch(req.body);
//     const newBranchId = result.insertId;
//     // Fetch the newly created branch record
//     const [rows] = await branchModel.getBranchById(newBranchId);
//     res.status(201).json(rows[0]);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to create branch" });
//   }
// };
exports.createBranch = async (req, res) => {
  const { name, address, circle_id } = req.body;

  try {
    // Check duplicate branch name
    const [existing] = await branchModel.checkBranchNameExists(name);

    if (existing.length > 0) {
      return res.status(400).json({
        error: "Branch name already exists."
      });
    }

    // Get the single Head Office
    const [headOfficeRows] = await branchModel.getSingleHeadOffice();

    if (headOfficeRows.length === 0) {
      return res.status(400).json({
        error: "Head Office not found."
      });
    }

    const head_office_id = headOfficeRows[0].id;

    // Create branch
    const [result] = await branchModel.createBranch({
      name,
      address,
      head_office_id,
      circle_id
    });

    const newBranchId = result.insertId;

    // Fetch newly created branch
    const [rows] = await branchModel.getBranchById(newBranchId);

    res.status(201).json(rows[0]);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to create branch"
    });
  }
};




// exports.updateBranch = async (req, res) => {
//   const { id } = req.params;
//   const { name, address, head_office_id, circle_id} = req.body;

//   try {
//     const [existing] = await branchModel.checkBranchNameExists(name, id);

//     if (existing.length > 0) {
//       return res.status(400).json({ error: "Branch name already exists." });
//     }
//     await branchModel.updateBranch(id, { name, address, head_office_id });
//     res.json({ message: "Branch updated successfully" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to update branch" });
//   }
// };

exports.updateBranch = async (req, res) => {
  const { id } = req.params;
  const { name, address, circle_id } = req.body;

  try {
    // Check duplicate branch name
    const [existing] = await branchModel.checkBranchNameExists(name, id);

    if (existing.length > 0) {
      return res.status(400).json({
        error: "Branch name already exists."
      });
    }

    // Get the single Head Office
    const [headOfficeRows] = await branchModel.getSingleHeadOffice();

    if (headOfficeRows.length === 0) {
      return res.status(400).json({
        error: "Head Office not found."
      });
    }

    const head_office_id = headOfficeRows[0].id;

    // Update branch
    await branchModel.updateBranch(id, {
      name,
      address,
      head_office_id,
      circle_id
    });

    res.json({
      message: "Branch updated successfully"
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to update branch"
    });
  }
};












exports.deleteBranch = async (req, res) => {
  const { id } = req.params;
  try {
    await branchModel.deleteBranch(id);
    res.json({ message: "Branch deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete branch" });
  }
};

exports.checkUsernameExists = async (req, res) => {
  const { username } = req.query;

  try {
    const [rows] = await branchModel.findByUsername(username);

    return res.json(rows.length > 0);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to check username" });
  }
};

exports.checkEmailExists = async (req, res) => {
  const { email } = req.query;

  try {
    const [rows] = await branchModel.findByEmail(email);

    return res.json(rows.length > 0);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to check email" });
  }
};

exports.getBranchesWithAdminStatus = async (req, res) => {
  try {
    const [rows] = await branchModel.getBranchesWithAdminStatus();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch branches" });
  }
};

exports.getBranchCountByHeadOfficeId = async (req, res) => {
  const { headOfficeId } = req.params;
  try {
    const [result] = await branchModel.getBranchCountByHeadOfficeId(
      headOfficeId
    );
    res.json(result[0]); // return { count: number }
  } catch (err) {
    console.error("Error fetching Branch count by head office:", err);
    res.status(500).json({ error: "Failed to fetch Branch count" });
  }
};



// Get branches by Head Office
exports.getBranchesByHeadOfficeId = async (req, res) => {
  try {
    const { headOfficeId } = req.params;

    if (!headOfficeId) {
      return res.status(400).json({
        success: false,
        message: "Head Office ID is required",
      });
    }

    const [rows] =
      await branchModel.getBranchesByHeadOfficeId(headOfficeId);

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });

  } catch (err) {
    console.error("Get Branches By Head Office Error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to fetch branches",
    });
  }
};