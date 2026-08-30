const eventLogModel = require("../models/eventLogModel");

exports.getAllEvents = async (req, res) => {

    try {

        const [rows] = await eventLogModel.getAllEvents();

        res.status(200).json(rows);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Failed to fetch events"
        });

    }

};