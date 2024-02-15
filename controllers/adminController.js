const { json } = require("express");
const Admin = require("../models/Admin");
const Category = require("../models/Category");
const Product = require("../models/Product");
const User = require("../models/User");
const Orders = require("../models/Orders");
const Address = require("../models/Address");

const bcrypt = require("bcrypt");

const loadLogin = (req, res) => {
  res.render("adminViews/login");
};

const authenticateAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email: email });

    if (!admin) {
      return res.json({ message: "Invalid username or password" });
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);

    if (!passwordMatch) {
      return res.json({ message: "Invalid username or password" });
    }

    console.log(admin);
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

const loadDashboard = (req, res) => {
  res.render("adminViews/dashboard");
};

const loadProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      {
        $lookup: {
          from: "categories", // Assuming your category collection is named 'categories'
          localField: "category.parentCategory",
          foreignField: "_id",
          as: "parentCategory",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category.subCategory",
          foreignField: "_id",
          as: "subCategory",
        },
      },
      {
        $unwind: "$parentCategory",
      },
      {
        $unwind: "$subCategory",
      },
      {
        $project: {
          _id: 1,
          name: 1,
          price: 1,
          status: 1,
          parentCategory: "$parentCategory.name",
          subCategory: "$subCategory.name",
          totalQuantity: {
            $sum: "$variants.quantity",
          },
        },
      },
    ]);

    // console.log(products);

    res.render("adminViews/products", { products });
  } catch (error) {
    console.log(error);
  }
};

const loadAddProduct = async (req, res) => {
  try {
    const categories = await Category.find({
      isParentCategory: true,
    });

    res.render("adminViews/add-product", { categories });
  } catch (error) {
    console.log(error);
  }
};

const addProduct = async (req, res) => {
  try {
    const files = req.files;
    const images = files.map((file) => file.filename);

    const {
      name,
      description,
      price,
      parentCategory,
      subCategory,
      combinations,
    } = req.body;

    const variants = JSON.parse(combinations);

    const product = new Product({
      name,
      description: description.trim(),
      price,
      variants,
      category: {
        parentCategory: parentCategory,
        subCategory: subCategory,
      },
      images,
    });
    await product.save();

    res.json({ message: "product created successfully" });
  } catch (error) {
    console.log(error);
  }
};

const loadEditProduct = async (req, res) => {
  try {
    const id = req.params.id;
    // console.log(id);
    const product = await Product.findById(id);

    //all parentCategories
    const parentCategories = await Category.find({ isParentCategory: true });

    //all subCategories which have parentCategory as product's parentCategory
    const subCategories = await Category.find({
      parentCategory: product.category.parentCategory,
    });

    res.render("adminViews/edit-product", {
      product,
      parentCategories,
      subCategories,
    });
  } catch (error) {
    console.log(error);
  }
};

const editProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      parentCategory,
      subCategory,
      combinations,
      removedFiles,
    } = req.body;
    const id = req.params.id;

    const variants = JSON.parse(combinations);

    const removedFilesArray = JSON.parse(removedFiles);

    const product = await Product.findById(id);
    console.log("product:", product);

    if (removedFilesArray.length) {
      product.images = product.images.filter(
        (element) => !removedFilesArray.includes(element.split(".")[0])
      );
      console.log(removedFilesArray);
      const files = req.files;
      const uploadedImages = files.map((file) => file.filename);
      product.images.push(...uploadedImages);
    }

    product.name = name;
    product.description = description.trim();
    product.price = price;
    product.category.parentCategory = parentCategory;
    product.category.subCategory = subCategory;

    product.variants = variants;

    await product.save();
    console.log("saved");
    res.json({ message: "product updated successfully" });
  } catch (error) {
    console.log(error);
  }
};

const loadCategory = async (req, res) => {
  try {
    // const categories = await Category.aggregate([
    //   {
    //     $match: { isParentCategory: true },
    //   },
    //   {
    //     $lookup: {
    //       from: "categories",
    //       localField: "_id",
    //       foreignField: "parentCategory",
    //       as: "subcategories",
    //     },
    //   },
    //   {
    //     $project: {
    //       _id: 0,
    //       parentId: "$_id",
    //       parentCategory: "$name",
    //       status: "$status",
    //       subcategories: {
    //         $map: {
    //           input: "$subcategories",
    //           as: "subcategory",
    //           in: {
    //             categoryId: "$$subcategory._id",
    //             categoryName: "$$subcategory.name",
    //             status: "$$subcategory.status",
    //           },
    //         },
    //       },
    //     },
    //   },
    // ]);

    const categories = await Category.find({ isParentCategory: true })
      .populate({
        path: "subcategories",
        select: "name status",
      })
      .exec();
    console.log(categories);

    res.render("adminViews/category", { categories });
  } catch (error) {
    console.log(error);
    res.send(error);
  }
};

const loadOrders = async (req, res) => {
  try {
    const orders = await Orders.find().populate("userId");
    console.log(orders);
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
    const { orderId } = req.body;
    console.log("updating status");

    const order = await Orders.findById(orderId);
    console.log(order);
    let message = "";
    if (order.orderStatus == "Pending") {
      order.orderStatus = "Shipped";
      message = "products shipped";
    } else if (order.orderStatus == "Shipped") {
      order.orderStatus = "Delivered";
      message = "products shipped";
    }
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
    res.render("adminViews/singleUser", { user });
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
  loadDashboard,
  loadProducts,
  loadAddProduct,
  getSubCategory,
  addProduct,
  loadEditProduct,
  editProduct,
  loadCategory,
  loadOrders,
  loadSingleOrder,
  updateOrderStatus,
  loadUsers,
  loadSingleUser,
  logout,
};
