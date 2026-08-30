const db = require("../config/db");

exports.getAllHeadOffice = () => {
  return db.query("SELECT * FROM head_office");
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


