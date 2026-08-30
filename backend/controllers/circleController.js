const circleModel = require("../models/circleModel");



// CREATE CIRCLE

exports.createCircle = (req,res)=>{


    console.log("========== CREATE CIRCLE CONTROLLER HIT ==========");

    console.log("REQUEST BODY:", req.body);



    const data={

        circle_name:req.body.circle_name,

        circle_code:req.body.circle_code,

        zone_id:req.body.zone_id

    };


    console.log("DATA GOING TO MODEL:", data);



    circleModel.createCircle(

        data,

        (err,result)=>{


            console.log("CREATE CIRCLE MODEL CALLBACK REACHED");


            if(err){

                console.log("CREATE CIRCLE DATABASE ERROR:",err);


                return res.status(500).json({

                    message:"Database error",

                    error:err

                });

            }



            console.log("INSERT RESULT:",result);



            res.status(201).json({

                message:"Circle created successfully",

                circle_id:result.insertId

            });


        }

    );


};







// GET ALL

exports.getAllCircles=(req,res)=>{


    console.log("========== GET ALL CIRCLES CONTROLLER HIT ==========");



    circleModel.getAllCircles(

        (err,result)=>{


            console.log("GET ALL CIRCLES CALLBACK REACHED");



            if(err){

                console.log("GET ALL ERROR:",err);


                return res.status(500).json(err);

            }



            console.log("ALL CIRCLES DATA:",result);



            res.json(result);


        }

    );


};








// GET BY ZONE

exports.getCirclesByZone=(req,res)=>{


    console.log("========== GET CIRCLES BY ZONE HIT ==========");


    console.log("ZONE ID:",req.params.zoneId);



    const zoneId=req.params.zoneId;



    circleModel.getCirclesByZone(

        zoneId,

        (err,result)=>{


            console.log("GET BY ZONE CALLBACK REACHED");



            if(err){

                console.log("GET BY ZONE ERROR:",err);


                return res.status(500).json(err);

            }



            console.log("ZONE CIRCLES DATA:",result);



            res.json(result);


        }

    );


};