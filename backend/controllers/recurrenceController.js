const recurrenceService = require("../services/recurrenceService");

exports.runRecurrence = async (req, res) => {
  try {

    await recurrenceService.processRecurringCirculars();

    res.json({
      message: "Recurrence process executed successfully"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Recurrence failed",
      error: error.message
    });

  }
};