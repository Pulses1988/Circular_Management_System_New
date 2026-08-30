const employeeModel = require("../models/employeesModal");
const bcrypt = require("bcrypt");
const transporter = require("../config/mailConfig");
const otpGenerator = require("otp-generator");
const jwt = require("jsonwebtoken");


const JWT_SECRET =
  process.env.JWT_SECRET ||
  "f47da57fdab5d8fdbe2b7855db15c11304197f2941d340cd302bbcddee0f04117f4ae1a5fbdb1e0a64f8f727587e3442bf9b44be6811f7f9c383f4860380b7f7";


const otpStore = {};

// Get all employees
exports.getAllEmployees = async (req, res) => {
  try {
    const [rows] = await employeeModel.getAllEmployees();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
};

exports.loginEmployee = async (req, res) => {
  try {
    const { employee_id, password } = req.body;

const employeeIdPattern = /^EMP\d{3}$/;

if (!employeeIdPattern.test(employee_id)) {
  return res.status(400).json({
    success: false,
    message: "Employee ID must be in the format EMP001.",
  });
}






    // Validation
    if (!employee_id || !password) {
      return res.status(400).json({
        success: false,
        message: "Employee ID and password are required",
      });
    }

    // Get employee data
    const [rows] = await employeeModel.loginEmployee(employee_id);

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid employee ID or password",
      });
    }

    const employee = rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(
      password,
      employee.password_hash
    );
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid employee ID or password",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        employeeId: employee.id,
        employee_id: employee.employee_id,
        role_id: employee.role_id,
        department_id: employee.department_id,
        branch_id: employee.branch_id,
        head_office_id: employee.head_office_id,
        head_office_name: employee.head_office_name,
        can_create_circular: employee.can_create_circular,
        can_approve_circular: employee.can_approve_circular,
        bank_name: employee.bank_name,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Remove password_hash from response
    delete employee.password_hash;

    // Success response
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token: token,
        employee: employee,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get employee by ID
exports.getEmployeeById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await employeeModel.getEmployeeById(id);
    if (rows.length === 0)
      return res.status(404).json({ error: "Employee not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch employee" });
  }
};

// Get employees for specific Head Office with branch_id NULL
exports.getEmployeesByHeadOfficeWithoutBranch = async (req, res) => {
  const { id: hoId } = req.params;
  try {
    const [rows] = await employeeModel.getEmployeesByHeadOfficeWithoutBranch(
      hoId
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
};

// Get employees for a specific Region
exports.getEmployeesByRegion = async (req, res) => {
  const { id: regionId } = req.params;
  try {
    const [rows] = await employeeModel.getEmployeesByRegion(regionId);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
};

// Get employees for a specific Zone
exports.getEmployeesByZone = async (req, res) => {
  const { id: zoneId } = req.params;
  try {
    const [rows] = await employeeModel.getEmployeesByZone(zoneId);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
};

// Get employees for a specific Circle
exports.getEmployeesByCircle = async (req, res) => {
  const { id: circleId } = req.params;
  try {
    const [rows] = await employeeModel.getEmployeesByCircle(circleId);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
};

// Get employees by Department
exports.getEmployeesByDepartment = async (req, res) => {
  const { departmentId } = req.params;
  try {
    const [rows] = await employeeModel.getEmployeesByDepartment(departmentId);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch employees by department" });
  }
};

// Get employees for specific branch
exports.getEmployeesByBranch = async (req, res) => {
  const { id: branchId } = req.params;
  try {
    const [rows] = await employeeModel.getEmployeesByBranch(branchId);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
};

// Create new employee
exports.createEmployee = async (req, res) => {
  try {
    const [result] = await employeeModel.createEmployee(req.body);
    const newId = result.insertId;
    const [rows] = await employeeModel.getEmployeeById(newId);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create employee" });
  }
};

// Update employee
exports.updateEmployee = async (req, res) => {
  const { id } = req.params;
  try {
    await employeeModel.updateEmployee(id, req.body);
    res.json({ message: "Employee updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update employee" });
  }
};

// Delete employee
exports.deleteEmployee = async (req, res) => {
  const { id } = req.params;
  try {
    await employeeModel.deleteEmployee(id);
    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete employee" });
  }
};

// Check if employee_id exists
exports.checkEmployeeIdExists = async (req, res) => {
  const { employee_id } = req.query;
  try {
    const [rows] = await employeeModel.findByEmployeeId(employee_id);
    res.json(rows.length > 0);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to check employee_id" });
  }
};

// Check if email exists
exports.checkEmailExists = async (req, res) => {
  const { email } = req.query;
  try {
    const [rows] = await employeeModel.findByEmail(email);
    res.json(rows.length > 0);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to check email" });
  }
};

exports.checkPhoneNoExists = async (req, res) => {
  const { phone } = req.query;
  try {
    const [rows] = await employeeModel.findByPhone(phone);
    res.json(rows.length > 0);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to check phone number" });
  }
};

// Get employees with approve authority
exports.getApprovers = async (req, res) => {
  try {
    const [rows] = await employeeModel.getApprovers();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch approvers" });
  }
};

// Filter employees by department and branch
exports.filterEmployees = async (req, res) => {
  const { department_id, branch_id } = req.query;
  try {
    const [rows] = await employeeModel.filterEmployees(
      department_id,
      branch_id
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
};

exports.AllEmployeeCount = async (req, res) => {
  try {
    const [result] = await employeeModel.getAllEmployeesCount();
    res.json(result[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch employees count" });
  }
};
exports.BranchEmployeeCount = async (req, res) => {
  try {
    const { branchId } = req.params;
    console.log("Branch ID:", branchId);

    if (!branchId) {
      return res.status(400).json({ error: "branchId is required" });
    }

    const [result] = await employeeModel.getByBranchEmployeesCount(branchId);

    res.json(result[0]); // { count: 39 }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch Branch employees count" });
  }
};



// Get logged-in employee profile
exports.getMyProfile = async (req, res) => {
  try {

    const employeeId = req.user.employeeId;

    const [rows] = await employeeModel.getCurrentEmployeeProfile(employeeId);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    res.status(200).json({
      success: true,
      data: rows[0]
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Failed to fetch profile"
    });
  }
};    



exports.sendForgotPasswordOtp = async (req, res) => {

    try{

        const {employee_id,email}=req.body;

        if(!employee_id || !email){

            return res.status(400).json({
                success:false,
                message:"Employee ID and Email are required"
            });

        }

        const [rows]=await employeeModel.findEmployeeForForgotPassword(employee_id,email);

        if(rows.length===0){

            return res.status(404).json({
                success:false,
                message:"Employee not found"
            });

        }

        const otp=otpGenerator.generate(6,{
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false
        });

        otpStore[employee_id]={
            otp:otp,
            expires:Date.now()+5*60*1000
        };

        await transporter.sendMail({

            from:'pragati1.pulsestechnology@gmail.com',
            to:email,
            subject:"Password Reset OTP",

            text:`Your OTP is ${otp}`

        });

        res.json({

            success:true,
            message:"OTP Sent Successfully"

        });

    }
    catch(err){

        console.log(err);

        res.status(500).json({

            success:false,
            message:"Server Error"

        });

    }

}   


exports.verifyOtp = async(req,res)=>{

    try{

        const {employee_id,otp}=req.body;

        if(!otpStore[employee_id]){

            return res.status(400).json({

                success:false,
                message:"OTP Not Found"

            });

        }

        if(Date.now()>otpStore[employee_id].expires){

            delete otpStore[employee_id];

            return res.status(400).json({

                success:false,
                message:"OTP Expired"

            });

        }

        if(otpStore[employee_id].otp!=otp){

            return res.status(400).json({

                success:false,
                message:"Invalid OTP"

            });

        }

        res.json({

            success:true,
            message:"OTP Verified"

        });

    }

    catch(err){

        console.log(err);

        res.status(500).json({

            success:false,
            message:"Server Error"

        });

    }

}   



exports.resetPassword=async(req,res)=>{

    try{

        const {employee_id,newPassword}=req.body;

        const hash=await bcrypt.hash(newPassword,10);

        const [rows]=await employeeModel.findByEmployeeId(employee_id);

        if(rows.length===0){

            return res.status(404).json({

                success:false,
                message:"Employee Not Found"

            });

        }

        await employeeModel.updatePassword(rows[0].id,hash);

        delete otpStore[employee_id];

        res.json({

            success:true,
            message:"Password Changed Successfully"

        });

    }

    catch(err){

        console.log(err);

        res.status(500).json({

            success:false,
            message:"Server Error"

        });

    }

}   


//COntroller For HIGHER AUTORITY API

exports.testHigherAuthority = async (req, res) => {

    const employeeId = req.params.employeeId;

    const [rows] =
        await employeeModel.getHigherAuthority(employeeId);

    res.json(rows);

}
 

//Rolewsie employee controller 
exports.getEmployeesByRole = async (req, res) => {

  const { id: roleId } = req.params;

  try {

    const [rows] = await employeeModel.getEmployeesByRole(roleId);

    res.json(rows);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Failed to fetch employees"
    });

  }

};   


//Logic for get employee Count by using Head_office 

exports.HeadOfficeEmployeeCount = async (req, res) => {
  try {
    const { headOfficeId } = req.params;

    const [result] =
      await employeeModel.getEmployeesCountByHeadOffice(headOfficeId);

    res.json(result[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch employee count",
    });
  }
};  

//Add new controller for reporting Offficer 
// Get Branch Managers - used as Reporting Officers
exports.getBranchManagers = async (req, res) => {
  try {
    const { branchId } = req.params;

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: "branchId is required"
      });
    }

    const [rows] = await employeeModel.getBranchManagers(branchId);

    res.json({
      success: true,
      data: rows
    });

  } catch (err) {
    console.error("Get Branch Managers Error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to fetch branch managers"
    });
  }
};  



// Get employees by role level
exports.getEmployeesByRoleLevel = async (req, res) => {
  const { roleLevel } = req.params;

  try {
    if (!roleLevel) {
      return res.status(400).json({
        success: false,
        message: "roleLevel is required"
      });
    }

    const [rows] = await employeeModel.getEmployeesByRoleLevel(roleLevel);

    res.json({
      success: true,
      data: rows
    });

  } catch (err) {
    console.error("Get Employees By Role Level Error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to fetch employees by role level"
    });
  }
};