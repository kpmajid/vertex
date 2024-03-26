const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      color: {
        type: String,
        required: true,
      },
      size: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        default: 1,
      },
      price: {
        type: Number,
        required: true,
      },
      cancel: {
        status: { type: String },
        reason: { type: String },
        date: { type: Date },
      },
      return: {
        status: { type: String },
        reason: { type: String },
        date: { type: Date },
      },
    },
  ],
  shippingAddress: {
    fullname: {
      type: String,
      required: true,
    },
    mobile: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    pincode: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    street: {
      type: String,
      required: true,
    },
  },
  paymentMethod: {
    type: String,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid", "Failed", "Refunded"],
    default: "Pending",
  },
  orderStatus: {
    type: String,
    enum: ["Pending", "Shipped", "Delivered", "Cancelled", "Returned"],
    default: "Pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  originalTotal: {
    type: Number,
    required: true,
  },
  finalTotal: {
    type: Number,
    required: true,
  },
  coupon: {
    code: { type: String },
    couponId: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon" },
    discountAmount: { type: Number },
  },
  order_number: {
    type: Number,
    requried: true,
  },
});

module.exports = mongoose.model("Order", orderSchema);
