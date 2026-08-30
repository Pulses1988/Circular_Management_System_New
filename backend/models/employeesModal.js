const db = require("../config/db");
const bcrypt = require("bcrypt");

// Get all employees with role, department, branch names

// exports.getAllEmployees = () => {
//   return db.query(`
//     SELECT e.id, e.employee_id, e.first_name, e.middle_name, e.last_name,
//            e.phone_no, e.email, e.can_create_circular,e.can_approve_circular, e.created_at,
//            r.name AS role_name,
//            d.name AS department_name,
//            b.name AS branch_name
//     FROM employees e
//     LEFT JOIN roles r ON e.role_id = r.id
//     LEFT JOIN departments d ON e.department_id = d.id
//     LEFT JOIN branches b ON e.branch_id = b.id
//   `);
// }; 
exports.getAllEmployees = () => {
  return db.query(`
    SELECT 
      e.id,
      e.employee_id,
      e.first_name,
      e.middle_name,
      e.last_name,
      e.phone_no,
      e.email,

      e.role_id,
      e.role_level,
      e.department_id,
      e.branch_id,
      e.head_office_id,

      e.can_create_circular,
      e.can_approve_circular,
      e.created_at,

      r.name AS role_name,
      d.name AS department_name,
      b.name AS branch_name

    FROM employees e

    LEFT JOIN roles r 
      ON e.role_id = r.id

    LEFT JOIN departments d 
      ON e.department_id = d.id

    LEFT JOIN branches b 
      ON e.branch_id = b.id
  `);
};


exports.getEmployeeById = (id) => {
  return db.query(
    `
    SELECT e.*, 
           r.name AS role_name,
           d.name AS department_name,
           b.name AS branch_name
    FROM employees e
    LEFT JOIN roles r ON e.role_id = r.id
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN branches b ON e.branch_id = b.id
    WHERE e.id = ?
  `,
    [id]
  );
};

// exports.loginEmployee = (employee_id) => {
//   return db.query(
//     `
//     SELECT e.id, e.employee_id, e.password_hash, e.first_name, e.middle_name, e.last_name,
//            e.phone_no, e.email, e.role_id, e.department_id, e.branch_id, e.head_office_id,
//            e.can_create_circular, e.can_approve_circular, e.created_at,
//            r.name AS role_name,
//            d.name AS department_name,
//            b.name AS branch_name,
//            b.address AS branch_address,
//            ho.name AS head_office_name,
//            ho.address AS head_office_address,
//            ho.bank_name AS head_office_bank_name
//     FROM employees e
//     LEFT JOIN roles r ON e.role_id = r.id
//     LEFT JOIN departments d ON e.department_id = d.id
//     LEFT JOIN branches b ON e.branch_id = b.id
//     LEFT JOIN head_office ho ON e.head_office_id = ho.id
//     WHERE e.employee_id = ?
//     `,
//     [employee_id]
//   );
// };  



exports.loginEmployee = (employee_id) => {
  return db.query(
    `
    SELECT e.id,
           e.employee_id,
           e.password_hash,
           e.first_name,
           e.middle_name,
           e.last_name,
           e.phone_no,
           e.email,
           e.role_id,
           e.department_id,
           e.branch_id,
           e.head_office_id,
           e.can_create_circular,
           e.can_approve_circular,
           e.created_at,
           r.name AS role_name,
           d.name AS department_name,
           b.name AS branch_name,
           b.address AS branch_address,
           ho.name AS head_office_name,
           ho.address AS head_office_address,
           ho.bank_name AS head_office_bank_name
    FROM employees e
    LEFT JOIN roles r ON e.role_id = r.id
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN branches b ON e.branch_id = b.id
    LEFT JOIN head_office ho ON e.head_office_id = ho.id
    WHERE BINARY e.employee_id = ?
    `,
    [employee_id]
  );
};







exports.createEmployee = ({
  employee_id,
  password,
  first_name,
  middle_name,
  last_name,
  phone_no,
  email,
  role_id,
  role_level,
  department_id,
  branch_id,
  head_office_id,
  reporting_officer_id,
  can_create_circular,
  can_approve_circular,
}) => {
  const password_hash = bcrypt.hashSync(password, 10);

  return db.query(
    `INSERT INTO employees 
    (
      employee_id,
      password_hash,
      first_name,
      middle_name,
      last_name,
      phone_no,
      email,
      role_id,
      role_level,
      department_id,
      branch_id,
      head_office_id,
      reporting_officer_id,
      can_create_circular,
      can_approve_circular
    ) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      employee_id,
      password_hash,
      first_name || null,
      middle_name || null,
      last_name || null,
      phone_no || null,
      email || null,
      role_id || null,
      role_level || null,
      department_id || null,
      branch_id || null,
      head_office_id || null,
      reporting_officer_id || null,
      can_create_circular || null,
      can_approve_circular || null,
    ]
  );
};

exports.updateEmployee = (
  id,
  {
    first_name,
    middle_name,
    last_name,
    phone_no,
    email,
    role_id, 
    role_level,
    department_id,
    branch_id,
    head_office_id, 
    reporting_officer_id,
    can_create_circular,
    can_approve_circular,
  }
) => {
  return db.query(
    `UPDATE employees 
     SET first_name=?, middle_name=?, last_name=?, phone_no=?, email=?, 
         role_id=?, role_level=?, department_id=?, branch_id=?, head_office_id=?,reporting_officer_id=?, can_create_circular=?,can_approve_circular=?
     WHERE id=?`,
    [
      first_name || null,
      middle_name || null,
      last_name || null,
      phone_no || null,
      email || null,
      role_id || null,
        role_level || null,
      department_id || null,
      branch_id || null,
      head_office_id || null, 
      reporting_officer_id || null,
      can_create_circular || null,
      can_approve_circular || null,
      id,
    ]
  );
};

exports.deleteEmployee = (id) => {
  return db.query("DELETE FROM employees WHERE id = ?", [id]);
};

exports.findByEmployeeId = (employee_id) => {
  return db.query("SELECT id FROM employees WHERE employee_id = ?", [
    employee_id,
  ]);
};

exports.findByEmail = (email) => {
  return db.query("SELECT id FROM employees WHERE email = ?", [email]);
};

exports.findByPhone = (phone) => {
  return db.query("SELECT id FROM employees WHERE phone_no = ?", [phone]);
};

// Get employees for a specific Head Office, but branch_id is NULL
exports.getEmployeesByHeadOfficeWithoutBranch = (hoId) => {
  return db.query(
    `
    SELECT e.id, e.employee_id, e.first_name, e.middle_name, e.last_name,
           e.phone_no, e.email, e.head_office_id, e.can_create_circular, e.can_approve_circular, e.created_at,
           r.id AS role_id,
           r.name AS role_name,
           d.id AS department_id,
           d.name AS department_name,
           b.id AS branch_id,
           b.name AS branch_name
    FROM employees e
    LEFT JOIN roles r ON e.role_id = r.id
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN branches b ON e.branch_id = b.id
    WHERE e.head_office_id = ? AND e.branch_id IS NULL
    `,
    [hoId]
  );
};

// Get employees for a specific Region through Department -> Branch -> Circle -> Zone
exports.getEmployeesByRegion = (regionId) => {
  return db.query(
    `
    SELECT e.id, e.employee_id, e.first_name, e.middle_name, e.last_name,
           e.phone_no, e.email, e.role_id, e.department_id, e.branch_id,
           e.can_create_circular, e.can_approve_circular, e.created_at,
           r.name AS role_name,
           d.name AS department_name,
           b.name AS branch_name
    FROM employees e
    INNER JOIN departments d ON e.department_id = d.id
    INNER JOIN branches b ON d.branch_id = b.id
    INNER JOIN circle_table c ON b.circle_id = c.circle_id
    INNER JOIN zones z ON c.zone_id = z.id
    INNER JOIN regions rg ON z.region_id = rg.id
    LEFT JOIN roles r ON e.role_id = r.id
    WHERE rg.id = ?
    `,
    [regionId],
  );
};

// Get employees for a specific Zone through Department -> Branch -> Circle
exports.getEmployeesByZone = (zoneId) => {
  return db.query(
    `
    SELECT e.id, e.employee_id, e.first_name, e.middle_name, e.last_name,
           e.phone_no, e.email, e.role_id, e.department_id, e.branch_id,
           e.can_create_circular, e.can_approve_circular, e.created_at,
           r.name AS role_name,
           d.name AS department_name,
           b.name AS branch_name
    FROM employees e
    INNER JOIN departments d ON e.department_id = d.id
    INNER JOIN branches b ON d.branch_id = b.id
    INNER JOIN circle_table c ON b.circle_id = c.circle_id
    INNER JOIN zones z ON c.zone_id = z.id
    LEFT JOIN roles r ON e.role_id = r.id
    WHERE z.id = ?
    `,
    [zoneId],
  );
};

// Get employees for a specific Circle through Department -> Branch
exports.getEmployeesByCircle = (circleId) => {
  return db.query(
    `
    SELECT e.id, e.employee_id, e.first_name, e.middle_name, e.last_name,
           e.phone_no, e.email, e.role_id, e.department_id, e.branch_id,
           e.can_create_circular, e.can_approve_circular, e.created_at,
           r.name AS role_name,
           d.name AS department_name,
           b.name AS branch_name
    FROM employees e
    INNER JOIN departments d ON e.department_id = d.id
    INNER JOIN branches b ON d.branch_id = b.id
    INNER JOIN circle_table c ON b.circle_id = c.circle_id
    LEFT JOIN roles r ON e.role_id = r.id
    WHERE c.circle_id = ?
    `,
    [circleId],
  );
};

// Get employees by department ID
exports.getEmployeesByDepartment = (departmentId) => {
  return db.query("SELECT * FROM employees WHERE department_id = ?", [
    departmentId,
  ]);
};

// Get employees for a specific branch
exports.getEmployeesByBranch = (branchId) => {
  return db.query(
    `
    SELECT e.id, e.employee_id, e.first_name, e.middle_name, e.last_name,
           e.phone_no, e.email,e.role_id,e.department_id,e.branch_id, e.can_create_circular, e.can_approve_circular, e.created_at,
           r.name AS role_name,
           d.name AS department_name,
           b.name AS branch_name
    FROM employees e
    LEFT JOIN roles r ON e.role_id = r.id
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN branches b ON e.branch_id = b.id
    WHERE e.branch_id = ?
  `,
    [branchId]
  );
};

// employee get based on the department id and branch id
exports.filterEmployees = (department_id, branch_id) => {
  let query = `
    SELECT 
      e.id, e.employee_id, e.first_name, e.middle_name, e.last_name, e.phone_no, e.email,
      e.can_create_circular, e.can_approve_circular, e.created_at,
      r.id AS role_id, r.name AS role_name,
      d.id AS department_id, d.name AS department_name,
      b.id AS branch_id, b.name AS branch_name,
      h.id AS head_office_id, h.name AS head_office_name
    FROM employees e
    LEFT JOIN roles r ON e.role_id = r.id
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN branches b ON e.branch_id = b.id
    LEFT JOIN head_office h ON e.head_office_id = h.id
    WHERE 1=1
  `;
  const params = [];
  if (department_id) {
    query += " AND e.department_id = ?";
    params.push(department_id);
  }
  if (branch_id) {
    query += " AND e.branch_id = ?";
    params.push(branch_id);
  }
  return db.query(query, params);
};

// Get employees who have approve authority
exports.getApprovers = () => {
  return db.query(`
    SELECT e.id, e.employee_id, e.first_name, e.middle_name, e.last_name,
           e.phone_no, e.email, e.can_create_circular, e.can_approve_circular, e.created_at,
           r.name AS role_name,
           d.name AS department_name,
           b.name AS branch_name,
           ho.name AS head_office_name
    FROM employees e
    LEFT JOIN roles r ON e.role_id = r.id
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN branches b ON e.branch_id = b.id
    LEFT JOIN head_office ho ON e.head_office_id = ho.id
    WHERE e.can_approve_circular = TRUE
    ORDER BY e.created_at DESC
  `);
};

exports.getAllEmployeesCount = () => {
  return db.query(`SELECT COUNT(*) as count FROM employees`);
};

exports.getByBranchEmployeesCount = (branchId) => {
  return db.query(
    `SELECT COUNT(*) AS count 
     FROM employees 
     WHERE branch_id = ?`,
    [branchId]
  );
};




exports.getCurrentEmployeeProfile = (employeeId) => {
  return db.query(
    `
    SELECT
        e.id,
        e.employee_id,
        e.first_name,
        e.middle_name,
        e.last_name,
        e.phone_no,
        e.email,
        e.created_at,

        r.name AS role_name,
        d.name AS department_name,
        b.name AS branch_name,
        ho.name AS head_office_name

    FROM employees e

    LEFT JOIN roles r
        ON e.role_id = r.id

    LEFT JOIN departments d
        ON e.department_id = d.id

    LEFT JOIN branches b
        ON e.branch_id = b.id

    LEFT JOIN head_office ho
        ON e.head_office_id = ho.id

    WHERE e.id = ?
    `,
    [employeeId]
  );
};    


exports.findEmployeeForForgotPassword = (employee_id, email) => {
  return db.query(
    `
    SELECT id,
           employee_id,
           email
    FROM employees
    WHERE employee_id = ?
    AND email = ?
    `,
    [employee_id, email]
  );
};   


exports.updatePassword = (id, passwordHash) => {
  return db.query(
    `
    UPDATE employees
    SET password_hash = ?
    WHERE id = ?
    `,
    [passwordHash, id]
  );
};    


// SEND TO higher autority

exports.getHigherAuthority = (employeeId) => {
  return db.query(
    `
    SELECT
        higherEmp.id,
        higherEmp.first_name,
        higherEmp.last_name,
        higherEmp.email,
        higherEmp.role_id,
        higherRole.name AS role_name

    FROM employees creator

    JOIN roles creatorRole
        ON creator.role_id = creatorRole.id

    JOIN roles higherRole
        ON higherRole.position = creatorRole.position - 1
        AND higherRole.department_id = creatorRole.department_id

    JOIN employees higherEmp
        ON higherEmp.role_id = higherRole.id

    WHERE creator.id = ?
    LIMIT 1
    `,
    [employeeId]
  );
};  


// Creators id for higher Authority
exports.getCircularById = async (circularId) => {
    return db.query(
        `SELECT creator_employee_id
         FROM circulars
         WHERE id = ?`,
        [circularId]
    );
};



//role_wise 
exports.getEmployeesByRole = (roleId) => {
  return db.query(
    `
    SELECT
        e.id,
        e.employee_id,
        e.first_name,
        e.last_name,
        e.role_id, 
      
        r.name AS role_name,
        e.department_id,
        e.branch_id
    FROM employees e
    LEFT JOIN roles r
        ON e.role_id = r.id
    WHERE e.role_id = ?
    `,
    [roleId]
  );
};  


//getEMployeeCountByheadOffice 
exports.getEmployeesCountByHeadOffice = (headOfficeId) => {
  return db.query(
    `SELECT COUNT(*) AS count
     FROM employees
     WHERE head_office_id = ?`,
    [headOfficeId]
  );
};  


//Add new fuction for reporting_officer 
// Get managers of a specific branch
exports.getBranchManagers = (branchId) => {
  return db.query(
    `
    SELECT
        e.id,
        e.employee_id,
        e.first_name,
        e.middle_name,
        e.last_name,
        e.role_id,
        r.name AS role_name,
        e.branch_id,
        e.department_id
    FROM employees e
    INNER JOIN roles r
        ON e.role_id = r.id
    WHERE e.branch_id = ?
      AND LOWER(r.name) = 'manager'
    ORDER BY e.first_name, e.last_name
    `,
    [branchId]
  );
};  


//Seperate Api for Role_level 
// Get employees by role level
exports.getEmployeesByRoleLevel = (roleLevel) => {
  return db.query(
    `
    SELECT
        e.id,
        e.employee_id,
        e.first_name,
        e.middle_name,
        e.last_name,
        e.phone_no,
        e.email,
        e.role_id,
        e.role_level,
        r.name AS role_name,
        e.department_id,
        d.name AS department_name,
        e.branch_id,
        b.name AS branch_name,
        e.head_office_id
    FROM employees e
    LEFT JOIN roles r
        ON e.role_id = r.id
    LEFT JOIN departments d
        ON e.department_id = d.id
    LEFT JOIN branches b
        ON e.branch_id = b.id
    WHERE LOWER(TRIM(e.role_level)) = LOWER(TRIM(?))
    ORDER BY e.first_name, e.last_name
    `,
    [roleLevel]
  );
};