const eventEmitter = require("../events/eventEmitter");
const eventLogModel = require("../models/eventLogModel");
const ruleEngine = require("../ruleEngine/ruleEngine");
const circularReadReminderService = require('../services/circularReadReminderService');
// const ruleEngineService = require("../services/ruleEngineService");

// eventEmitter.on(
//     "CIRCULAR_CREATED",
//     (data)=>{

//         console.log(
//             "Rule Triggered: Circular Created"
//         );

//         console.log(data);

//     }
// );  



// Circular Completed Rule

eventEmitter.on("CIRCULAR_CREATED", async (data) => {

    console.log("Rule Triggered: Circular Created");
    console.log(data);

    try {

        await eventLogModel.createEvent({

            event_name: "CIRCULAR_CREATED",

            entity_type: "CIRCULAR",

            entity_id: data.circularId,

            triggered_by: data.creatorId,

            description: "Circular Created Successfully"

        });

        console.log("Event saved into database");
         // Execute Rule Engine
        await ruleEngine.execute("CIRCULAR_CREATED", data);



    } catch (err) {

        console.error("Error saving event:", err);

    }

});









// eventEmitter.on(
//     "CIRCULAR_COMPLETED",
//     (data)=>{

//         console.log(
//             "Rule Triggered: Circular Completed"
//         );

//         console.log(data);

//     }
// );   



// eventEmitter.on("CIRCULAR_UPDATED", (data) => {
//     console.log("Rule Triggered: Circular Updated");
//     console.log(data);
// });
eventEmitter.on("CIRCULAR_COMPLETED", async (data) => {

    console.log("Rule Triggered: Circular Completed");

    await eventLogModel.createEvent({
        event_name: "CIRCULAR_COMPLETED",
        entity_type: "CIRCULAR",
        entity_id: data.circularId,
        triggered_by: data.creatorId,
        description: "Circular Completed Successfully"
    });
 await ruleEngine.execute(
        "CIRCULAR_COMPLETED",
        data
    );
});








eventEmitter.on("CIRCULAR_UPDATED", async (data) => {

    console.log("Rule Triggered: Circular Updated");

    await eventLogModel.createEvent({
        event_name: "CIRCULAR_UPDATED",
        entity_type: "CIRCULAR",
        entity_id: data.circularId,
        triggered_by: data.creatorId,
        description: "Circular Updated Successfully"
    });

});



// eventEmitter.on("CIRCULAR_DELETED", (data) => {
//     console.log("Rule Triggered: Circular Deleted");
//     console.log(data);
// });   
eventEmitter.on("CIRCULAR_DELETED", async (data) => {

    console.log("Rule Triggered: Circular Deleted");

    await eventLogModel.createEvent({
        event_name: "CIRCULAR_DELETED",
        entity_type: "CIRCULAR",
        entity_id: data.circularId,
        triggered_by: data.creatorId,
        description: "Circular Deleted Successfully"
    });

});

eventEmitter.on("CIRCULAR_ASSIGNED_TO_APPROVER", async (data) => {

    console.log("Rule Triggered: Circular Assigned To Approver");

    await eventLogModel.createEvent({
        event_name: "CIRCULAR_ASSIGNED_TO_APPROVER",
        entity_type: "CIRCULAR",
        entity_id: data.circularId,
        triggered_by: data.creatorId,
        description: `Circular assigned to approver ${data.approverId}`
    });

    await ruleEngine.execute("CIRCULAR_ASSIGNED_TO_APPROVER", data);

});

eventEmitter.on("CIRCULAR_ASSIGNED_TO_EMPLOYEES", (data) => {
    console.log("Rule Triggered: Circular Assigned To Employees");
    console.log(data);
});   


eventEmitter.on("CIRCULAR_APPROVED", async (data) => {

    console.log("Rule Triggered: Circular Approved");

    await eventLogModel.createEvent({
        event_name: "CIRCULAR_APPROVED",
        entity_type: "CIRCULAR",
        entity_id: data.circularId,
        triggered_by: data.approverId,
        description: `Circular approved by approver ${data.approverId}`
    });

}); 

eventEmitter.on("CIRCULAR_PARTIALLY_APPROVED", async (data) => {

    console.log("Rule Triggered: Circular Partially Approved");

    await eventLogModel.createEvent({
        event_name: "CIRCULAR_PARTIALLY_APPROVED",
        entity_type: "CIRCULAR",
        entity_id: data.circularId,
        triggered_by: data.approverId,
        description: `Approval recorded. ${data.pendingCount} approval(s) still pending`
    });

});  

eventEmitter.on("CIRCULAR_FULLY_APPROVED", async (data) => {

    console.log("Rule Triggered: Circular Fully Approved");

    await eventLogModel.createEvent({
        event_name: "CIRCULAR_FULLY_APPROVED",
        entity_type: "CIRCULAR",
        entity_id: data.circularId,
        triggered_by: data.approverId,
        description: "Circular fully approved and published"
    }); 

     // NEW
     await ruleEngine.execute("CIRCULAR_FULLY_APPROVED", data);
     // In this application final approval is the point at which published_at is
     // set. Start reminder processing here, never when a draft is created.
     await circularReadReminderService.startForPublishedCircular(data);

});


eventEmitter.on("CIRCULAR_REJECTED", async (data) => {

    console.log("Rule Triggered: Circular Rejected");

    await eventLogModel.createEvent({
        event_name: "CIRCULAR_REJECTED",
        entity_type: "CIRCULAR",
        entity_id: data.circularId,
        triggered_by: data.approverId,
        description: `Circular rejected. Reason: ${data.comments}`
    });

    await ruleEngine.execute("CIRCULAR_REJECTED", data);

});    


eventEmitter.on("ALL_EMPLOYEES_COMPLETED", async (data) => {

    console.log("Rule Triggered: All Employees Completed");

    await eventLogModel.createEvent({

        event_name: "ALL_EMPLOYEES_COMPLETED",
        entity_type: "CIRCULAR",
        entity_id: data.circularId,
        triggered_by: null,
        description: "All assigned employees completed the circular"

    });

    await ruleEngine.execute("ALL_EMPLOYEES_COMPLETED", data);

});

eventEmitter.on("EMPLOYEE_COMPLETED_CIRCULAR", async (data) => {

    console.log("Rule Triggered: Employee Completed Circular");

    await eventLogModel.createEvent({
        event_name: "EMPLOYEE_COMPLETED_CIRCULAR",
        entity_type: "CIRCULAR",
        entity_id: data.circularId,
        triggered_by: data.employeeId,
        description: `Employee ${data.employeeId} completed the circular`
    });

    await ruleEngine.execute("EMPLOYEE_COMPLETED_CIRCULAR", data);
});
