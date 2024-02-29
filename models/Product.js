const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  originalPrice: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    default: null,
  },
  discountedPrice: {
    type: Number,
    default: null,
  },
  variants: [
    {
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
        required: true,
      },
    },
  ],
  status: {
    type: String,
    enum: ["listed", "unlisted"],
    default: "listed",
  },
  category: {
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
  },
  images: {
    type: [String],
    default: [],
  },
  discountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Discount",
    default: null,
  },
});

module.exports = mongoose.model("Product", productSchema);
