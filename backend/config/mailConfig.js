const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "pragati1.pulsestechnology@gmail.com",
    pass: "icfx cubj caer bdew"
  }
});

module.exports = transporter;