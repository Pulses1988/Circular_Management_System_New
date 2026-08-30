const circularModel = require("../models/circularModel"); 
const circularVisibilityModel = require("../models/circularVisibilityModel");
const notificationModel = require("../models/notificationModel");


exports.processRecurringCirculars = async () => {
  try {
    console.log("========================================");
    console.log("Checking recurring circulars...");
    console.log("Time:", new Date().toLocaleString());

    const [rows] = await circularModel.getDueRecurringCirculars();

    if (rows.length === 0) {
      console.log("No recurring circulars found.");
      console.log("========================================");
      return;
    }

    console.log(`Found ${rows.length} recurring circular(s).`);

    for (const row of rows) {

      console.log("------------------------------");
      console.log("Processing Circular:", row.id);

      let nextDate = new Date(row.next_recurrence_date);
      console.log("OLD DATE FROM DB:", row.next_recurrence_date);
console.log("BEFORE CALCULATION:", nextDate);
console.log("Repeat Cycle ID:", row.repeat_cycle_id);

     // Weekly
if (row.repeat_cycle_id == 4) {
    nextDate.setDate(nextDate.getDate() + 7);
}

// Monthly
else if (row.repeat_cycle_id == 2) {
    nextDate.setMonth(nextDate.getMonth() + 1);
}

// Quarterly
else if (row.repeat_cycle_id == 3) {
    nextDate.setMonth(nextDate.getMonth() + 3);
}

// Yearly
else if (row.repeat_cycle_id == 5) {
    nextDate.setFullYear(nextDate.getFullYear() + 1);
}

// Fortnight
else if (row.repeat_cycle_id == 6) {
    nextDate.setDate(nextDate.getDate() + 14);
}

// Half-Yearly
else if (row.repeat_cycle_id == 7) {
    nextDate.setMonth(nextDate.getMonth() + 6);
}
const recurringData = {

    title: row.title,
    content: row.content,
    creator_employee_id: row.creator_employee_id,

    reference_circular_id: row.id,

    circular_code: row.circular_code,

    source_type_id: row.source_type_id,

    effective_from: new Date(),

    send_type: row.send_type,

    repeat_cycle_id: row.repeat_cycle_id,

    is_recurring: 0,

    current_cycle_number:
        row.current_cycle_number + 1,

    last_recurrence_date:
        new Date(),

    next_recurrence_date:
        nextDate,


    // IMPORTANT
    status: "APPROVED",

    published_at:
        new Date(),

    priority:
        row.priority,

    special_keyword:
        row.special_keyword

};


const [newCircular] =
    await circularModel.createRecurringCircular(
        recurringData
    );


const newCircularId = newCircular.insertId;


console.log(
"New recurring circular created:",
newCircularId
); 

//Employee copy date //

const [employees] =
await circularVisibilityModel
.getEmployeesByCircularId(row.id);


if(employees.length > 0){

 const empIds =
 employees.map(e=>e.employee_id);


 await circularVisibilityModel.assignToEmployees(
    newCircularId,
    empIds
 );


 console.log(
 "Employees assigned:",
 empIds.length
 );

}



















      await circularModel.updateRecurringCircular(
        row.id,
        row.current_cycle_number+1,
        new Date(),
        nextDate
      );

      console.log("✅ Circular Updated Successfully");
      console.log("New Cycle :", row.current_cycle_number + 1);
      console.log("Next Date :", nextDate);
    }

    console.log("========================================");

  } catch (err) {
    console.error("Recurrence Service Error:", err);
  }
};