const nodemailer = require("nodemailer");
require("dotenv").config();

async function sendMail(destination, otp) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // use SSL
    auth: {
      user: process.env.MY_EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  const info = await transporter.sendMail({
    from: '"From Majid" <kpmajid584@gmail.com>',
    to: `${destination}`,
    subject: "Verification OTP",
    text: `OTP: ${otp}`,
    html: `<b>Hello world?</b>
      <p>Enter the OTP for verifying ${otp}</p>`,
  });
}

module.exports = sendMail;
