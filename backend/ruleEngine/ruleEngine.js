// ruleEngine/ruleEngine.js

// const ruleRegistry = require("./ruleRegistry");
// const actionExecutor = require("./actionExecutor");

// async function execute(eventName, data) {

//     console.log("=================================");
//     console.log("RULE ENGINE STARTED");
//     console.log("Incoming Event :", eventName);
//     console.log("=================================");

//     const rules = ruleRegistry[eventName];

//     if (!rules || rules.length === 0) {

//         console.log("No Rule Found");

//         return;
//     }

//     console.log(`${rules.length} Rule(s) Found`);

//     for (const rule of rules) {

//         if (!rule.active) continue;

//         console.log("---------------------------------");
//         console.log("Rule :", rule.ruleName);
//         console.log("Action :", rule.action);

//         await actionExecutor.executeAction(rule.action, data);

//     }

// }

// module.exports = {
//     execute
// };   


const ruleEngineService = require("../services/ruleEngineService");

async function execute(eventName, data) {

    console.log("=================================");
    console.log("RULE ENGINE STARTED");
    console.log("Incoming Event :", eventName);
    console.log("=================================");

    await ruleEngineService.executeRules(eventName, data);

}

module.exports = {
    execute
};