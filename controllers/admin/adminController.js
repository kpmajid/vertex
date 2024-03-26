const Admin = require("../../models/Admin");
const Category = require("../../models/Category");
const Product = require("../../models/Product");

const Orders = require("../../models/Orders");
const Address = require("../../models/Address");
const Discounts = require("../../models/Discounts");

const { ObjectId } = require("mongodb");

const mongoose = require("mongoose");

const bcrypt = require("bcrypt");

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isParentCategory: true });
    console.log(categories);
    console.log("categories");
    res.status(200).json({ categories });
  } catch (error) {
    console.log(error);
  }
};

const loadOrders = async (req, res) => {
  try {
    const orders = await Orders.find()
      .populate("userId")
      .sort({ order_number: -1 });
    res.render("adminViews/orders", { orders });
  } catch (error) {
    console.log(error);
  }
};

const loadSingleOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Orders.findOne({ _id: orderId }).populate(
      "products.productId"
    );

    // const order = await Orders.findById(orderId).populate("products.productId");

    console.log(order);

    res.render("adminViews/singleOrder", { order });

    // const {
    //   shippingAddress,
    //   products,
    //   paymentMethod,
    //   paymentStatus,
    //   orderStatus,
    //   total,
    //   createdAt,
    //   _id,
    //   userId,
    // } = order;

    // const addressDoc = await Address.findOne({ userId });
    // const address = addressDoc.addresses.find((address) =>
    //   address._id.equals(shippingAddress)
    // );

    // res.render("adminViews/singleOrder", {
    //   address,
    //   products,
    //   paymentMethod,
    //   paymentStatus,
    //   orderStatus,
    //   total,
    //   createdAt,
    //   _id,
    // });
  } catch (error) {
    console.log(error);
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    console.log(req.body);
    const { orderId, selectedStatus } = req.body;
    console.log("updating status");

    const order = await Orders.findById(orderId);
    console.log(order);
    // if (order.orderStatus == "Pending") {
    //   order.orderStatus = "Shipped";
    //   message = "products shipped";
    // } else if (order.orderStatus == "Shipped") {
    //   order.orderStatus = "Delivered";
    //   message = "products shipped";
    // }

    order.orderStatus = selectedStatus;
    let message = `products ${selectedStatus}`;

    if (selectedStatus == "Delivered") {
      order.paymentStatus = "Paid";
    }

    order.save();
    res.status(200).json({ message });
  } catch (error) {
    console.log(error);
  }
};

const getSubCategory = async (req, res) => {
  try {
    const { parentId } = req.body;
    const subCategories = await Category.find({
      parentCategory: parentId,
    });

    console.log("subCategories: " + subCategories);
    res.json({ subCategories });
  } catch (error) {
    console.log(error);
  }
};

const loadDiscount = async (req, res) => {
  try {
    const discounts = await Discounts.find();
    res.render("adminViews/discount", { discounts });
  } catch (error) {
    console.log(error);
  }
};

const loadAddDiscount = (req, res) => {
  try {
    console.log("loadAddDiscount");
    res.render("adminViews/add-discount");
  } catch (error) {
    console.log(error);
  }
};

const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    console.log(products);
    res.json(products);
  } catch (error) {
    console.log(error);
  }
};

const createDiscount = async (req, res) => {
  try {
    console.log("creatingDiscount");
    const { name, discountPercentage, start, end } = req.body;
    console.log(req.body);

    const discount = new Discounts({
      name,
      value: discountPercentage,
      start,
      end,
    });
    await discount.save();

    res.status(200).json({ message: "Discount created successfully." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error." });
  }
};

const getOffers = async (req, res) => {
  try {
    const offers = await Discounts.aggregate([
      {
        $match: {
          end: {
            $gte: new Date(),
          },
        },
      },
      {
        $project: {
          name: { $concat: ["$name", " ", { $toString: "$value" }, "% off"] },
        },
      },
    ]);
    res.status(200).json({ offers });
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  getSubCategory,
  getCategories,
  loadOrders,
  loadSingleOrder,
  updateOrderStatus,

  loadDiscount,
  loadAddDiscount,
  getProducts,
  createDiscount,
  getOffers,
};
