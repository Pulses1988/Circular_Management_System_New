const express=require("express");

const router=express.Router();

const circleController=require("../controllers/circleController");



router.post(
"/create",
circleController.createCircle
);



router.get(
"/",
circleController.getAllCircles
);



router.get(
"/zone/:zoneId",
circleController.getCirclesByZone
);



module.exports=router;