// ruleEngine/ruleRegistry.js

module.exports = { 

      CIRCULAR_CREATED: [
    {
        ruleName: "Create Circular Rule",
        action: "CREATE_CIRCULAR",
        active: true
    }
        
    // {   ruleName: "Audit Circular Creation",
    //     action: "AUDIT_CIRCULAR_CREATED",
    //     active: true
    // }

],

    CIRCULAR_FULLY_APPROVED: [

        {
            ruleName: "Publish Circular Rule",
            action: "PUBLISH_CIRCULAR",
            active: true
        }

    ],

  CIRCULAR_ASSIGNED_TO_APPROVER: [

        {
            ruleName: "Notify Approver Rule",
            action: "NOTIFY_APPROVER",
            active: true
        }

    ],


    ALL_EMPLOYEES_COMPLETED: [

    {
        ruleName: "All Employees Completed Rule",
        action: "ENABLE_CREATOR_COMPLETION",
        active: true
    }

],
  
CIRCULAR_COMPLETED:[
    {
        ruleName:"Circular Completion Rule",
        action:"MARK_CIRCULAR_COMPLETED",
        active:true
    }
]



};