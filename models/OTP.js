const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  otp: String,
  email: String,
  timeStamp: {
    type: String,
    default: () => new Date().toISOString(),
  },
});

module.exports = mongoose.model("OTP", otpSchema);
