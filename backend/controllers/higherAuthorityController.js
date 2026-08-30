const higherAuthorityModel = require("../models/higherAuthorityModel");

exports.getPendingCirculars = async (req, res) => {

    try {

        const { employeeId } = req.params;

        const [rows] =
            await higherAuthorityModel.getPendingCircularsByHigherAuthority(employeeId);

        res.json({
            success: true,
            data: rows
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};