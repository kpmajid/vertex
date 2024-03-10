const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  otp: String,
  email: String,
  timeStamp: {
    type: String,
    default: () => new Date().toISOString(),
  },
  expireAt: {
    type: Date,
    default: () => new Date(Date.now() + 5 * 60 * 1000), // 5 minutes in milliseconds
  },
});

otpSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("OTP", otpSchema);
