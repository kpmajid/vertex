const Admin = require("../models/Admin");
const Category = require("../models/Category");
const Product = require("../models/Product");
const User = require("../models/User");
const Orders = require("../models/Orders");
const Address = require("../models/Address");
const Discounts = require("../models/Discounts");

const { ObjectId } = require("mongodb");

const mongoose = require("mongoose");

const bcrypt = require("bcrypt");

const loadLogin = (req, res) => {
  res.render("adminViews/login");
};

const authenticateAdmin = async (req, res) => {
  try {
    console.log("admin login");
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email: email });

    if (!admin) {
      return res.json({ message: "Invalid username or password" });
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);

    if (!passwordMatch) {
      return res.json({ message: "Invalid username or password" });
    }

    req.session.admin = admin._id;
    res.redirect("/admin/dashboard");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const registerAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const isExist = await Admin.findOne({ email: email });

    if (isExist) {
      return res.json({ success: false, message: "admin already exist." });
    }
    let hashedPassword = await bcrypt.hash(password, 10);

    const admin = new Admin({
      email,
      password: hashedPassword,
    });
    await admin.save();
    res.json({ success: true, message: "new admin created." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

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
    const orders = await Orders.find().populate("userId");
    res.render("adminViews/orders", { orders });
  } catch (error) {
    console.log(error);
  }
};

const loadSingleOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Orders.findById(orderId).populate("products.productId");

    console.log(order);

    const {
      shippingAddress,
      products,
      paymentMethod,
      paymentStatus,
      orderStatus,
      total,
      createdAt,
      _id,
      userId,
    } = order;

    const addressDoc = await Address.findOne({ userId });
    const address = addressDoc.addresses.find((address) =>
      address._id.equals(shippingAddress)
    );

    res.render("adminViews/singleOrder", {
      address,
      products,
      paymentMethod,
      paymentStatus,
      orderStatus,
      total,
      createdAt,
      _id,
    });
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
    order.save();
    res.status(200).json({ message });
  } catch (error) {
    console.log(error);
  }
};

const loadUsers = async (req, res) => {
  try {
    let filter = {};

    if (req.query.status) {
      filter.isBlocked = req.query.status;
    }
    console.log(filter);
    const users = await User.find(filter).select({ password: 0 });

    users.forEach((user) => {
      user.formattedCreatedAt = user.createdAt.toLocaleDateString("en-GB");
    });

    const status = filter.isBlocked;
    res.render("adminViews/users", { users, status });
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

const loadSingleUser = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id);
    user.formattedCreatedAt = user.createdAt.toLocaleDateString("en-GB");
    const userId = user._id.toString();
    console.log(userId);
    const orders = await Orders.find({ userId: userId });
    console.log(orders);
    res.render("adminViews/singleUser", { user, orders });
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

const removeDiscount = async (req, res) => {
  try {
    console.log(req.body);
    const { discountId } = req.body;
    const discount = await Discounts.findById(discountId);

    let productsToUpdate = [];

    // if (discount.offerType === "category") {
    //   const categoryObjectIds = discount.applicableTo.map(
    //     (id) => new mongoose.Types.ObjectId(id)
    //   );
    //   productsToUpdate = await Product.aggregate([
    //     {
    //       $match: {
    //         $or: [
    //           { "category.parentCategory": { $in: categoryObjectIds } },
    //           { "category.subCategory": { $in: categoryObjectIds } },
    //         ],
    //       },
    //     },
    //   ]);
    // } else {
    //   const productObjectIds = discount.applicableTo.map(
    //     (id) => new mongoose.Types.ObjectId(id)
    //   );
    //   productsToUpdate = await Product.find({ _id: { $in: productObjectIds } });
    // }

    // for (const product of productsToUpdate) {
    //   console.log("updating product");
    //   console.log(product);

    //   product.discount = null;
    //   product.discountedPrice = null;

    //   await product.save();
    //   console.log("saved product");
    // }
    await Discounts.findByIdAndDelete(discountId);
    res.status(200).json({ message: "Discount removed successfully" });
  } catch (error) {
    console.log(error);
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

const logout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
    res.status(500).render("error", { error: error.message });
  }
};

module.exports = {
  loadLogin,
  authenticateAdmin,
  registerAdmin,
  getSubCategory,
  getCategories,
  loadOrders,
  loadSingleOrder,
  updateOrderStatus,
  loadUsers,
  loadSingleUser,
  loadDiscount,
  loadAddDiscount,
  getProducts,
  createDiscount,
  removeDiscount,
  getOffers,
  logout,
};
