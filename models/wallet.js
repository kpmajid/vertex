const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  balance: {
    type: Number,
    required: true,
  },
  transactions: [
    {
      date: {
        type: Date,
        default: Date.now,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ["debit", "credit"],
        require: true,
      },
    },
  ],
});

module.exports = mongoose.model("Wallet", walletSchema);
