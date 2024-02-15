const User = require("../models/User");
const Otp = require("../models/OTP");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Cart = require("../models/Cart");
const Address = require("../models/Address");
const Orders = require("../models/Orders");

const bcrypt = require("bcrypt");
const sendEmail = require("../services/sendEmail");
const generateOTP = require("../utils/generateOTP");

const loadHome = (req, res) => {
  const user = req.session?.user ?? null;
  res.render("usersViews/index", { user });
};

const loadLogin = (req, res) => {
  res.render("usersViews/login");
};

const authUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ message: "user not found" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    console.log(passwordMatch);
    if (!passwordMatch) {
      return res.json({ message: "Invalid password" });
    }

    req.session.user = { id: user._id };

    console.log("logged");
    res.redirect("/");
  } catch (error) {
    console.log(error);
  }
};

const loadRegister = (req, res) => {
  res.render("usersViews/register");
};

const registerUser = async (req, res) => {
  try {
    console.log("user register reached");
    const { name, email, password } = { ...req.body };

    if (!name || !email || !password) {
      return res.json({ status: "", message: "please provide information" });
    }

    const isExist = await User.findOne({ email });
    if (isExist) {
      return res.json({
        status: "",
        message: `User with ${email} id already exist`,
      });
    }
    console.log("saving user");

    let hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
    });

    console.log("saving user");
    await user.save();

    const cart = new Cart({
      userId: user._id,
      products: [],
    });

    await cart.save();
    const address = new Address({
      userId: user._id,
      address: [],
    });
    await address.save();

    console.log("OTP");
    let otp = generateOTP();

    let hashedOtp = await bcrypt.hash(otp, 10);
    const saveOtp = new Otp({
      email,
      otp: hashedOtp,
    });
    await saveOtp.save();

    req.session.email = email;

    try {
      await sendEmail(email, otp);
      console.log("Email sent successfully");
    } catch (emailError) {
      console.log("Error sending email:", emailError);
      // Handle the email sending error
    }

    res.redirect("/register/otp");
  } catch (error) {
    console.log(error);
  }
};

const loadValidateOTP = async (req, res) => {
  try {
    res.render("usersViews/validateOTP");
  } catch (error) {
    console.log(error);
  }
};

const verifyOTP = async (req, res) => {
  try {
    const userProvidedOtp = req.body.otp;
    const email = req.session.email;
    if (!email) {
      return res.redirect("/login");
    }

    console.log(userProvidedOtp);

    if (!userProvidedOtp) {
      return res.json({ status: "", message: "please provide otp" });
    }

    const userOtp = await Otp.findOne({
      email,
    }).sort({ timeStamp: -1 });

    const otpMatch = await bcrypt.compare(userProvidedOtp, userOtp.otp);
    if (!otpMatch) {
      return res.json({ status: "", message: "invalid OTP" });
    }

    const user = await User.findOne({ email });

    user.isVerified = true;

    await user.save();

    res.redirect("/login");
  } catch (error) {
    console.log(error);
  }
};

const changeUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ success: false, message: "User not found." });
    }

    const newStatus = !user.isBlocked;
    console.log(user.isBlocked, newStatus);
    await User.findByIdAndUpdate(userId, {
      $set: { isBlocked: newStatus },
    });

    res.json({ success: true, message: "User status updated." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const renderForgotPasswordForm = (req, res) => {
  res.render("usersViews/forgot-password");
};

const initiateForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log(email);
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ message: "user not found" });
    }

    let otp = generateOTP();

    let hashedOtp = await bcrypt.hash(otp, 10);
    const saveOtp = new Otp({
      email,
      otp: hashedOtp,
    });
    await saveOtp.save();

    try {
      await sendEmail(email, otp);
      console.log("Email sent successfully");
    } catch (emailError) {
      console.log("Error sending email:", emailError);
      // Handle the email sending error
    }

    res.render("usersViews/verify-forgot-password", {
      email,
      errorMessage: false,
    });
  } catch (error) {
    console.log(error);
  }
};

const verifyForgotPasswordOTP = async (req, res) => {
  try {
    const { email, ...otpObj } = req.body;
    const otpValuesArray = Object.values(otpObj);
    const otp = otpValuesArray.join("");
    console.log(email);
    console.log(otp);

    if (!otp) {
      res.render("usersViews/verify-forgot-password", {
        email,
        errorMessage: "Please provide OTP.",
      });
    }

    const userOtp = await Otp.findOne({
      email,
    }).sort({ timeStamp: -1 });

    const isValidOTP = await bcrypt.compare(otp, userOtp.otp);
    console.log(isValidOTP);

    if (isValidOTP) {
      // Render the new password page with the email value
      res.render("usersViews/newPasswordPage", { email });
    } else {
      res.render("usersViews/verify-forgot-password", {
        email,
        errorMessage: "Incorrect OTP. Please try again.",
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const updatePassword = async (req, res) => {
  try {
    let { email, password } = req.body;
    console.log(email, password);
    let user = await User.findOne({ email: email });

    if (!user) {
      return res.json({ message: "user not found" });
    }

    let hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    await user.save();
    res.redirect("/login");
  } catch (error) {
    console.log(error);
  }
};

const loadShop = async (req, res) => {
  try {
    const user = req.session?.user ?? null;

    const products = await Product.aggregate([
      {
        $lookup: {
          from: "categories",
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
        $match: {
          status: "listed",
          "parentCategory.status": "listed",
          "subCategory.status": "listed",
        },
      },
      {
        $project: {
          name: 1,
          price: 1,
          images: 1,
        },
      },
    ]);

    const categories = await Category.find({ isParentCategory: true })
      .populate({
        path: "subcategories",
        select: "name",
        match: { status: "listed" },
      })
      .exec();

    res.render("usersViews/shop", { products, categories, user });
  } catch (error) {
    console.log(error);
  }
};

const loadProduct = async (req, res) => {
  try {
    console.log("working?");
    const id = req.params.id;
    const product = await Product.findById(id);

    console.log(product);
    const uniqueColorsWithQuantity = product.variants
      .filter((variant) => variant.quantity > 0)
      .map((variant) => variant.color);

    console.log(uniqueColorsWithQuantity);
    const uniqueColors = [...new Set(uniqueColorsWithQuantity)];
    console.log(uniqueColors);
    const user = req.session?.user ?? null;
    res.render("usersViews/product", { product, uniqueColors, user });
  } catch (error) {
    console.log(error);
  }
};

const fetchVariants = async (req, res) => {
  try {
    const id = req.params.id;
    const selectedColor = req.params.color;

    const result = await Product.findOne(
      { _id: id },
      {
        variants: {
          $filter: {
            input: "$variants",
            as: "variant",
            cond: { $eq: ["$$variant.color", selectedColor] },
          },
        },
      }
    );
    const variants = result.variants;

    res.json({ variants });
  } catch (error) {
    console.log(error);
  }
};

const addToCart = async (req, res) => {
  try {
    console.log("addToCart");
    console.log(req.body);
    if (!req.session.user) {
      return res.status(401).json({ error: "Please login" });
    }

    const { id } = req.session.user;
    const { productId, color, size } = req.body;

    console.log(productId, color, size);

    const existingProduct = await Cart.findOne({
      userId: id,
      products: {
        $elemMatch: {
          productId: productId,
          color: color, // Color should not match
          size: size, // Size should not match
        },
      },
    });
    console.log(existingProduct);
    if (existingProduct) {
      return res.status(409).json({ message: "product is already in cart" });
    }

    const cart = await Cart.findOne({ userId: id });
    cart.products.push({ productId, color, size });
    await cart.save();

    return res
      .status(200)
      .json({ message: "Product added to the cart successfully", cart });
  } catch (error) {
    console.log(error);
  }
};

const loadProfile = async (req, res) => {
  try {
    const { id } = req.session.user;
    const user = await User.findById(id);
    res.render("usersViews/profile", { user });
  } catch (error) {
    console.log(error);
  }
};

const editProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const { id } = req.session.user;
    const isExist = await User.findOne({ email: email, _id: { $ne: id } });
    if (isExist) {
      return res.status(406).json({ message: `${email} already taken` });
    }
    const user = await User.findById(id);
    user.name = name;
    user.email = email;
    user.save();

    res.status(200).json({ message: "profile updated successfully" });
  } catch (error) {
    console.log(error);
  }
};

const loadPassword = (req, res) => {
  res.render("usersViews/password");
};

const loadAddress = async (req, res) => {
  try {
    const { id } = req.session.user;
    const addressesDoc = await Address.findOne({ userId: id });

    const addresses = addressesDoc?.addresses ?? null;

    res.render("usersViews/address", { addresses });
  } catch (error) {
    console.log(error);
  }
};

const removeAddress = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: "User not authenticated." });
    }
    const { id } = req.session.user;

    const { addressId } = req.body;
    if (!addressId) {
      return res
        .status(400)
        .json({ error: "addressId is missing in the request." });
    }
    const address = await Address.updateOne(
      { userId: id },
      { $pull: { addresses: { _id: addressId } } }
    );

    if (address.nModified === 0) {
      return res.status(404).json({ error: "Address not found." });
    }

    // Successful response
    return res.json({ success: true });
  } catch (error) {
    console.log(error);
  }
};

const loadAddAddress = (req, res) => {
  res.render("usersViews/add-address");
};

const addAddress = async (req, res) => {
  try {
    console.log("Add Address ");
    console.log(req.body);
    const { full_name, mobile, address, pincode, state, town_city, street } =
      req.body;
    const { id } = req.session.user;

    const addressDoc = await Address.findOne({ userId: id });

    addressDoc.addresses.push({
      fullname: full_name,
      mobile,
      address,
      pincode,
      state,
      city: town_city,
      street,
    });
    await addressDoc.save();

    res.status(200).json({ message: "address added" });
  } catch (error) {
    console.log(error);
  }
};

const loadEditAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    const { id } = req.session.user;
    const addressDoc = await Address.findOne(
      {
        userId: id,
        "addresses._id": addressId,
      },
      { "addresses.$": 1 }
    );
    const address = addressDoc.addresses[0];

    res.render("usersViews/edit-address", { address });
  } catch (error) {
    console.log(error);
  }
};

const editAddress = async (req, res) => {
  try {
    const { id } = req.session.user;
    const addressId = req.params.id;
    console.log(addressId);
    const { full_name, mobile, address, pincode, state, town_city, street } =
      req.body;

    const addressDoc = await Address.updateOne(
      {
        userId: id,
        "addresses._id": addressId,
      },
      {
        $set: {
          "addresses.$.fullname": full_name,
          "addresses.$.mobile": mobile,
          "addresses.$.address": address,
          "addresses.$.pincode": pincode,
          "addresses.$.state": state,
          "addresses.$.city": town_city,
          "addresses.$.street": street,
        },
      }
    );

    if (addressDoc.nModified === 0) {
      return res.status(404).json({ error: "Address not found." });
    }
    // Successful response
    return res.json({ success: true });
  } catch (error) {
    console.log(error);
  }
};

const loadCart = async (req, res) => {
  try {
    const { id } = req.session.user;
    const userCart = await Cart.findOne({ userId: id }).populate(
      "products.productId",
      "-description"
    );

    for (const cartProduct of userCart.products) {
      const product = cartProduct.productId;

      // console.log(product);

      if (product.status !== "listed") {
        cartProduct.message = "Product is unavailable";
        continue;
      }

      const parentCategory = await Category.findById(
        product.category.parentCategory
      );

      if (parentCategory && parentCategory.status !== "listed") {
        cartProduct.message = "Product is unavailable";
        continue;
      }

      // Check if sub category is unlisted
      const subCategory = await Category.findById(product.category.subCategory);
      if (subCategory && subCategory.status !== "listed") {
        cartProduct.message = "Product is unavailable";
        continue;
      }

      if (
        product.variants.some(
          (variant) =>
            variant.color === cartProduct.color &&
            variant.size === cartProduct.size &&
            variant.quantity == 0
        )
      ) {
        cartProduct.message = "Out Of Stock";
        continue;
      }

      if (
        product.variants.some(
          (variant) =>
            variant.color === cartProduct.color &&
            variant.size === cartProduct.size &&
            variant.quantity < cartProduct.quantity
        )
      ) {
        cartProduct.message = "We do not have enough stock";
        continue;
      }
    }
    const products = userCart?.products || null;
    res.render("usersViews/cart", { products });
  } catch (error) {
    console.log(error);
  }
};

// const loadCart = async (req, res) => {
//   try {
//     const { id } = req.session.user;
//     const cart = await Cart.findOne({ userId: id }).populate(
//       "products.productId",
//       "-category -description -variants -status"
//     );
//     // console.log(cart);
//     const products = cart?.products || null;
//     res.render("usersViews/cart", { products });
//   } catch (error) {
//     console.log(error);
//   }
// };

const removeProduct = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: "User not authenticated." });
    }

    const { id } = req.session.user;

    const { itemId } = req.body;
    if (!itemId) {
      return res
        .status(400)
        .json({ error: "itemId is missing in the request." });
    }

    const cart = await Cart.updateOne(
      { userId: id },
      {
        $pull: {
          products: {
            _id: itemId,
          },
        },
      }
    );

    //number of documents modified
    if (cart.nModified === 0) {
      return res.status(404).json({ error: "Item not found in the cart." });
    }

    // Successful response
    return res.json({ success: true });
  } catch (error) {
    console.log(error);
  }
};

const updateQuantity = async (req, res) => {
  try {
    const { itemId, change } = req.body;
    const { id } = req.session.user;

    const item = await Cart.findOne(
      { userId: id, "products._id": itemId },
      { "products.$": 1 }
    );

    const { productId, color, size, quantity } = item.products[0];

    // console.log(productId, color, size, quantity);

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ error: "Item not found in the cart." });
    }
    const variant = product.variants.find(
      (v) => v.color === color && v.size === size
    );

    const newQuantity = quantity + parseInt(change, 10);

    console.log(newQuantity);

    if (newQuantity <= 0) {
      return res.status(400).json({ message: "Invalid quantity change." });
    }

    if (variant.quantity < newQuantity && change == 1) {
      console.log("less than");
      return res.status(400).json({ message: "Insufficient stock." });
    }

    await Cart.updateOne(
      { userId: id, "products._id": itemId },
      { $set: { "products.$.quantity": newQuantity } }
    );

    if (newQuantity > variant.quantity) {
      errorMessage = "We do not have enough stock";
    } else {
      errorMessage = null;
    }

    return res.json({ success: true, errorMessage });

    // Successful response
  } catch (error) {
    console.log(error);
  }
};

const loadCheckOut = async (req, res) => {
  try {
    const { id } = req.session.user;
    const addressesDoc = await Address.findOne({ userId: id });
    const addresses = addressesDoc?.addresses ?? null;
    const cart = await Cart.findOne({ userId: id }).populate(
      "products.productId",
      "-description"
    );

    const products = cart.products;

    if (products.length <= 0) {
      res.status(400).redirect("/cart");
      return;
    }
    res.render("usersViews/checkout", { addresses, products });
  } catch (error) {
    console.log(error);
  }
};

const createOrder = async (req, res) => {
  try {
    console.log("createOrder");
    console.log(req.body);
    const { id } = req.session.user;
    const { addressId, paymentMethod } = req.body;
    const paymentStatus = paymentMethod === "paypal" ? "Paid" : "Pending";

    const cart = await Cart.findOne({ userId: id }).populate(
      "products.productId",
      "-category -description -variants -status -images"
    );

    const products = [];
    let total = 0;
    cart.products.forEach((cartItem) => {
      console.log(cartItem);
      const {
        productId: { _id: productId, price },
        color,
        size,
        quantity,
      } = cartItem;

      total += quantity * price;
      products.push({
        productId,
        price,
        color,
        size,
        quantity,
      });
    });

    const order = new Orders({
      userId: id,
      products,
      shippingAddress: addressId,
      paymentMethod,
      paymentStatus,
      total,
    });

    await order.save();

    cart.products = [];
    await cart.save();

    //decrease the quantity form the products
    for (const product of products) {
      const productDoc = await Product.findById(product.productId);

      const variantToUpdate = productDoc.variants.find(
        (v) => v.color === product.color && v.size === product.size
      );

      if (variantToUpdate) {
        variantToUpdate.quantity -= product.quantity;
        await productDoc.save();
      }
    }

    res.status(200).json({ message: "order placed successfully" });
  } catch (error) {
    console.log(error);
  }
};

const LoadOrders = async (req, res) => {
  try {
    const { id } = req.session.user;
    const orders = await Orders.find({ userId: id });
    res.render("usersViews/orders", { orders });
  } catch (error) {
    console.log(error);
  }
};

const LoadSingleOrder = async (req, res) => {
  try {
    const { id } = req.session.user;
    const orderId = req.params.orderId;
    console.log(orderId);

    const order = await Orders.findOne({ userId: id, _id: orderId }).populate(
      "products.productId"
    );

    console.log("order");
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
    } = order;

    const addressDoc = await Address.findOne({ userId: id });

    const address = addressDoc.addresses.find((address) =>
      address._id.equals(shippingAddress)
    );

    res.render("usersViews/singleOrder", {
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

const cancelOrder = async (req, res) => {
  try {
    const { id } = req.session.user;
    const { orderId } = req.body;
    const order = await Orders.findOne({ userId: id, _id: orderId });
    order.orderStatus = "Cancelled";
    order.paymentStatus = "Failed";
    console.log(order);
    await order.save();
    res.status(200).json({ message: "order canceled successfully" });
  } catch (error) {
    console.log(error);
  }
};

const changePassword = async (req, res) => {
  try {
    console.log("changing password");
    const { password, newPassword } = req.body;
    const { id } = req.session.user;
    const user = await User.findById(id);
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "wrong password" });
    }
    console.log("Matching");
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.save();
    res.status(200).json({ message: "password changed" });
  } catch (error) {
    console.log(error);
  }
};

const logout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
    res.status(500).render("error", { error: error.message });
  }
};

module.exports = {
  loadHome,
  loadLogin,
  authUser,
  loadRegister,
  registerUser,
  loadValidateOTP,
  verifyOTP,
  changeUserStatus,
  renderForgotPasswordForm,
  initiateForgotPassword,
  verifyForgotPasswordOTP,
  updatePassword,
  loadShop,
  loadProduct,
  fetchVariants,
  loadProfile,
  editProfile,
  loadAddress,
  removeAddress,
  loadAddAddress,
  addAddress,
  loadEditAddress,
  editAddress,
  loadCart,
  addToCart,
  removeProduct,
  updateQuantity,
  loadCheckOut,
  createOrder,
  LoadOrders,
  LoadSingleOrder,
  cancelOrder,
  loadPassword,
  changePassword,
  logout,
};