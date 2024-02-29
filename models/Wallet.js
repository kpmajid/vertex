const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  currentBalance: {
    type: Number,
    default:0,
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
        required: true,
      },
      amount:{
        type:Number,
        required:true,
      }
    },
  ],
});

module.exports = mongoose.model("Wallet", walletSchema);
