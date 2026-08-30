const headOfficeModel = require("../models/headOfficeModel");
const adminModel = require('../models/adminModel')

exports.getAllHeadOffice = async (req, res) => {
  try {
    const [rows] = await headOfficeModel.getAllHeadOffice();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch admins" });
  }
};
exports.getHeadOfficeById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await headOfficeModel.getHeadOfficeById(id);
    if (rows.length === 0)
      return res.status(404).json({ error: "Head office not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch Head Office" });
  }
}; 



// exports.createHeadOffice = async (req, res) => {
//   // const { name, address, bank_name } = req.body; 


// const {
//   name,
//   address,
//   bank_name,
//   bank_type,
//   bank,
//   headOffice,
//   region,
//   zone,
//   circle,
//   branch,
//   department,
//   designation,
//   employee,
// } = req.body;



//   try {
//     // 1. Create the head office and get its ID

//     // const [result] = await headOfficeModel.createHeadOffice({ name, address, bank_name });
//     const [result] = await headOfficeModel.createHeadOffice({
//   name,
//   address,
//   bank_name,
//   bank_type,
//   bank,
//   headOffice,
//   region,
//   zone,
//   circle,
//   branch,
//   department,
//   designation,
//   employee,
// });




//     const headOfficeId = result.insertId;

//     // 2. Assign this head office ID to the HO_ADMIN
//     await adminModel.assignHeadOfficeToHoAdmin(headOfficeId);

//     res.status(201).json({ message: "Head office created successfully", headOfficeId });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to create Head office" });
//   }
// };   

exports.createHeadOffice = async (req, res) => {

  const {
    name,
    address,
    bank_name,
    bank_type,
    bank,
    headOffice,
    region,
    zone,
    circle,
    branch,
    department,
    designation,
    employee,
  } = req.body;

  try {

    // 1. Check whether Head Office already exists
    const [countRows] = await headOfficeModel.getHeadOfficeCount();

    const headOfficeCount = countRows[0].count;

    if (headOfficeCount > 0) {
      return res.status(409).json({
        error: "Head Office already exists. Only one Head Office is allowed."
      });
    }

    // 2. Create the only Head Office
    const [result] = await headOfficeModel.createHeadOffice({
      name,
      address,
      bank_name,
      bank_type,
      bank,
      headOffice,
      region,
      zone,
      circle,
      branch,
      department,
      designation,
      employee,
    });

    const headOfficeId = result.insertId;

    // 3. Assign Head Office to HO Admin
    await adminModel.assignHeadOfficeToHoAdmin(headOfficeId);

    res.status(201).json({
      message: "Head office created successfully",
      headOfficeId
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Failed to create Head office"
    });
  }
};






















exports.deleteHeadOffice = async (req, res) => {
  const { id } = req.params;
  try {
    await headOfficeModel.deleteOffice(id);
    res.json({ message: "Head office deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete head office" });
  }
};


//Headoffice configuration 

exports.getHeadOfficeConfiguration = async (req, res) => {

    try {

        const { id } = req.params;

        const [rows] =
            await headOfficeModel.getHeadOfficeConfiguration(id);

        if (rows.length === 0) {
            return res.status(404).json({
                error: "Head Office not found"
            });
        }

        res.json(rows[0]);

    } catch (err) {

        console.log(err);

        res.status(500).json({
            error: "Unable to fetch configuration"
        });

    }

};    


//Controller for headOffice 

exports.updateHeadOffice = async (req, res) => {
  const { id } = req.params;

  try {
    await headOfficeModel.updateHeadOffice(id, req.body);

    res.json({
      message: "Head office updated successfully"
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to update head office"
    });
  }
};