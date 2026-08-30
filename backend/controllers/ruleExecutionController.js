const ruleExecutionModel =
require("../models/ruleExecutionModel");

exports.getAllExecutions = async (req,res)=>{

    try{

        const [rows] =
        await ruleExecutionModel.getAllExecutions();

        res.json(rows);

    }catch(err){

        console.log(err);

        res.status(500).json({

            message:"Failed to fetch rule executions"

        });

    }

}