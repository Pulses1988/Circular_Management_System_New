const db = require("../config/db"); // use the SAME DB import used in your other models

const settingsModel = {

  getMaxApprovers: async () => {
    return db.query(
      `SELECT setting_value
       FROM application_settings
       WHERE setting_key = 'MAX_APPROVERS'`
    );
  },

  updateMaxApprovers: async (maxApprovers) => {
    return db.query(
      `UPDATE application_settings
       SET setting_value = ?
       WHERE setting_key = 'MAX_APPROVERS'`,
      [maxApprovers]
    );
  }

};

module.exports = settingsModel;