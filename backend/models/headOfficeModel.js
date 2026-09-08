const db = require("../config/db");

// exports.getAllHeadOffice = () => {
//   return db.query("SELECT * FROM head_office");
// };
exports.getAllHeadOffice = () => {
  return db.query(`
    SELECT
      h.*,

      (
        SELECT COUNT(*)
        FROM branches b
        WHERE b.head_office_id = h.id
      ) AS branch_count,

      (
        SELECT COUNT(*)
        FROM departments d
        WHERE d.head_office_id = h.id
      ) AS direct_department_count,

      (
        SELECT COUNT(*)
        FROM departments d
        INNER JOIN branches b
          ON d.branch_id = b.id
        WHERE b.head_office_id = h.id
      ) AS branch_department_count,

      (
        SELECT COUNT(*)
        FROM employees e
        WHERE e.head_office_id = h.id
      ) AS employee_count,

      CASE
        WHEN
          (
            SELECT COUNT(*)
            FROM branches b
            WHERE b.head_office_id = h.id
          ) = 0

          AND

          (
            SELECT COUNT(*)
            FROM departments d
            WHERE d.head_office_id = h.id
          ) = 0

          AND

          (
            SELECT COUNT(*)
            FROM departments d
            INNER JOIN branches b
              ON d.branch_id = b.id
            WHERE b.head_office_id = h.id
          ) = 0

          AND

          (
            SELECT COUNT(*)
            FROM employees e
            WHERE e.head_office_id = h.id
          ) = 0

        THEN 1
        ELSE 0
      END AS can_delete

    FROM head_office h
    ORDER BY h.id
  `);
};

exports.getHeadOfficeById = (id) => {
  return db.query("SELECT * FROM head_office WHERE id = ?", [id]);
};

//Adding function to count head_office model 
exports.getHeadOfficeCount = () => {
  return db.query("SELECT COUNT(*) AS count FROM head_office");
};


exports.createHeadOffice = (headOfficeData) => {
  // const { name, address, bank_name } = headOfficeData;
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
} = headOfficeData;



  // return db.query(`INSERT INTO head_office(name,address,bank_name) VALUES(?,?,?)`, [
  //   name,
  //   bank_name,
  //   address || null,
  // ]); 
  
return db.query(
  `
  INSERT INTO head_office
  (
    name,
    address,
    bank_name,
    bank_type,
    bank,
    head_office,
    region,
    zone,
    circle,
    branch,
    department,
    designation,
    employee
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  [
    name,
    address || null,
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
  ]
);




}; 




exports.deleteOffice = (id) => {
  return db.query("DELETE FROM head_office WHERE id = ?", [id]);
};



//headoffice configuration 
exports.getHeadOfficeConfiguration = (headOfficeId) => {

    return db.query(
        `SELECT
            region,
            zone,
            circle,
            branch,
            department,
            designation,
            employee,
            bank_type
        FROM head_office
        WHERE id = ?`,
        [headOfficeId]
    );

};    



//head office update api 
exports.updateHeadOffice = (id, data) => {
  return db.query(
    `
    UPDATE head_office
    SET
      name=?,
      address=?,
      bank_name=?,
      bank_type=?,
      bank=?,
      head_office=?,
      region=?,
      zone=?,
      circle=?,
      branch=?,
      department=?,
      designation=?,
      employee=?
    WHERE id=?
    `,
    [
      data.name,
      data.address,
      data.bank_name,
      data.bank_type,
      data.bank,
      data.headOffice,
      data.region,
      data.zone,
      data.circle,
      data.branch,
      data.department,
      data.designation,
      data.employee,
      id
    ]
  );
};   

//to getting the count of employee,branch,departemt 
exports.getHeadOfficeUsage = (headOfficeId) => {
  return db.query(
    `
    SELECT

      /* Direct employees + branch employees */
      (
        SELECT COUNT(*)
        FROM employees e
        WHERE e.head_office_id = ?
      ) AS employee_count,

      /* All branches under this Head Office */
      (
        SELECT COUNT(*)
        FROM branches b
        WHERE b.head_office_id = ?
      ) AS branch_count,

      /* Direct HO departments */
      (
        SELECT COUNT(*)
        FROM departments d
        WHERE d.head_office_id = ?
      ) AS direct_department_count,

      /* Departments belonging to branches of this HO */
      (
        SELECT COUNT(*)
        FROM departments d
        INNER JOIN branches b
          ON d.branch_id = b.id
        WHERE b.head_office_id = ?
      ) AS branch_department_count
    `,
    [
      headOfficeId,
      headOfficeId,
      headOfficeId,
      headOfficeId
    ]
  );
};

