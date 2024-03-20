const User = require("../../models/User");
const Otp = require("../../models/OTP");
const Product = require("../../models/Product");
const Category = require("../../models/Category");
const Cart = require("../../models/Cart");
const Address = require("../../models/Address");
const Orders = require("../../models/Orders");
const Wallet = require("../../models/Wallet");
const Wishlist = require("../../models/Wishlist");
const Coupons = require("../../models/Coupons");

const { ObjectId } = require("mongodb");

const bcrypt = require("bcrypt");
const sendEmail = require("../../services/sendEmail");
const generateOTP = require("../../utils/generateOTP");

function generateReferralCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function generateUniqueReferralCode() {
  let uniqueCode;
  let codeExists = true;

  while (codeExists) {
    uniqueCode = generateReferralCode();
    // Check if the generated code already exists in the database
    const existingUser = await User.findOne({ referralCode: uniqueCode });
    if (!existingUser) {
      codeExists = false;
    }
  }

  return uniqueCode;
}

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

    if (!user.isVerified) {
      req.session.email = email;

      return res.redirect("/otp");
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

const renderRegisterForm = (req, res) => {
  res.render("usersViews/register");
};

const initiateUserRegister = async (req, res) => {
  try {
    console.log("initiateUserRegister");
    const { name, email, mobile, password, ref } = { ...req.body };

    if (!name || !email || !password || !mobile) {
      return res.json({ status: "", message: "please provide information" });
    }

    //checking if user already exist?
    const isExist = await User.findOne({ email });
    if (isExist) {
      return res.json({
        status: "",
        message: `User with ${email} id already exist`,
      });
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
    }

    const referralCode = await generateUniqueReferralCode();

    let hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      mobile,
      referralCode,
    });

    await user.save();

    req.session.email = email;
    req.session.ref = ref;

    //create cart
    const cart = new Cart({
      userId: user._id,
      products: [],
    });
    await cart.save();

    //create address
    const address = new Address({
      userId: user._id,
      address: [],
    });
    await address.save();

    //create wallet
    const wallet = new Wallet({
      user: user._id,
    });
    await wallet.save();

    //create whishlist
    const wishlist = new Wishlist({
      user: user._id,
    });
    await wishlist.save();

    res.status(200).json({ message: "user created successfully!" });
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
    console.log("verifyOTP");
    console.log(req.body);

    const { email, ref } = req.session;
    const { otp } = req.body;

    if (!email) {
      return res.redirect("/login");
    }

    if (!otp) {
      return res.status(400).json({ status: "", message: "OTP not found" });
    }

    const otpDoc = await Otp.findOne({
      email,
    }).sort({ timeStamp: -1 });

    console.log(otpDoc);

    const otpMatch = await bcrypt.compare(otp, otpDoc.otp);
    console.log("otpMatch");
    console.log(otpMatch);

    if (!otpMatch) {
      return res.status(401).json({ status: "", message: "invalid OTP" });
    }

    const user = await User.findOne({ email });
    user.isVerified = true;
    await user.save();

    if (ref) {
      await handleRefferal(ref, user._id);
    }

    res.redirect("/login");
  } catch (error) {
    console.log(error);
  }
};

const resendOTP = async (req, res) => {
  try {
    let { email } = req.session;
    let otp = generateOTP();
    let hashedOtp = await bcrypt.hash(otp, 10);
    const saveOtp = new Otp({
      email,
      otp: hashedOtp,
    });

    await saveOtp.save();
    await sendEmail(email, otp);

    res.status(200).json({ message: "otp resented" });
  } catch (error) {
    console.log(error);
  }
};

async function handleRefferal(referralCode, userId) {
  try {
    console.log("referralCode, userId");
    console.log(referralCode, userId);
    if (!referralCode) {
      return;
    }

    const referrer = await User.findOne({ referralCode: referralCode });
    console.log(referrer);
    if (!referrer) {
      return;
    }

    console.log(referrer._id);
    console.log(typeof referrer._id);
    console.log(userId);
    console.log(typeof userId);

    const referrerTransaction = {
      description: "Referral reward for referring a new user",
      type: "credit",
      amount: 70,
    };

    const refereeTransaction = {
      description: "Referral bonus for signing up using a referral link",
      type: "credit",
      amount: 50,
    };

    console.log("Updating referrer's wallet...");
    let referrerId = referrer._id;
    const referrerWallet = await Wallet.findOne({ user: referrerId });
    console.log(referrerWallet);
    referrerWallet.transactions.push(referrerTransaction);
    referrerWallet.currentBalance += 70;

    await referrerWallet.save();

    const refereeWallet = await Wallet.findOne({ user: userId });
    console.log(refereeWallet);
    refereeWallet.transactions.push(refereeTransaction);
    refereeWallet.currentBalance += 50;

    await refereeWallet.save();
  } catch (error) {
    console.log(error);
  }
}

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

    req.session.email = email;
    console.log("req.session.email");
    console.log(req.session.email);

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

    const categoriesQuery = req.query.categories
      ? req.query.categories.split(",")
      : [];
    const colors = req.query.colors ? req.query.colors.split(",") : [];
    const sizes = req.query.sizes ? req.query.sizes.split(",") : [];
    const minPrice = req.query.min || "";
    const maxPrice = req.query.max || "";

    console.log("colors,sizes,minPrice,maxPrice");
    console.log(categoriesQuery);
    console.log(colors);
    console.log(sizes);
    console.log(minPrice);
    console.log(maxPrice);

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
          from: "discounts",
          localField: "discountId",
          foreignField: "_id",
          as: "discountDetails",
        },
      },
      {
        $unwind: {
          path: "$discountDetails",
          preserveNullAndEmptyArrays: true,
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
          originalPrice: 1,
          discountedPrice: 1,
          discount: 1,
          discountPercent: "$discountDetails.value",
          images: 1,
        },
      },
    ]);

    const categories = await Category.aggregate([
      {
        $match: {
          isParentCategory: true,
          status: "listed",
          subcategories: { $ne: [] },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "subcategories",
          foreignField: "_id",
          as: "subcategories",
        },
      },
    ]);
    // console.log(categories);
    console.log(products.length);

    res.render("usersViews/shop", { products, categories, user });
  } catch (error) {
    console.log(error);
  }
};

const loadCategoryShop = async (req, res) => {
  try {
    const user = req.session?.user ?? null;
    const category = req.params.category;
    console.log(category);
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
          from: "discounts",
          localField: "discountId",
          foreignField: "_id",
          as: "discountDetails",
        },
      },
      {
        $unwind: {
          path: "$discountDetails",
          preserveNullAndEmptyArrays: true,
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
          "parentCategory.name": category,
          "parentCategory.status": "listed",
          "subCategory.status": "listed",
        },
      },
      {
        $project: {
          name: 1,
          originalPrice: 1,
          discountedPrice: 1,
          discount: 1,
          discountPercent: "$discountDetails.value",
          images: 1,
        },
      },
    ]);

    const categories = await Category.find({
      isParentCategory: true,
      name: category,
    })
      .populate({
        path: "subcategories",
        select: "name",
        match: { status: "listed" },
      })
      .exec();
    console.log("products");
    console.log(products);
    console.log("Categories");
    console.log(categories);

    res.render("usersViews/shop", { products, categories, user });
  } catch (error) {
    res.status(500).render("error", { error: error.message });
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

// const loadCart = async (req, res) => {
//   try {
//     const { id } = req.session.user;
//     const cartItems = await Cart.aggregate([
//       {
//         $match: {
//           userId: new ObjectId("65d25b7ffea88e9a743cc4f2"),
//         },
//       },
//       {
//         $unwind: {
//           path: "$products",
//         },
//       },
//       {
//         $lookup: {
//           from: "products",
//           localField: "products.productId",
//           foreignField: "_id",
//           as: "products.details",
//         },
//       },
//       {
//         $unwind: {
//           path: "$products.details",
//         },
//       },
//       {
//         $project: {
//           name: "$products.details.name",
//           color: "$products.color",
//           size: "$products.size",
//           quantity: "$products.quantity",
//           image: "$products.details.images",
//           discountedPrice: "$products.details.discountedPrice",
//           originalPrice: "$products.details.originalPrice",
//         },
//       },
//     ]);
//     console.log(cartItems);
//     res.send(cartItems);
//   } catch (error) {
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

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

    const coupon = req.session.coupon;
    let couponDoc;
    if (coupon.length > 0) {
      couponCode = couponCode.toUpperCase();
      couponDoc = await Coupons.findOne({ couponCode: couponCode });
    }
    // console.log("products loadCheclout");
    // console.log(products);

    console.log("addresses in load");
    console.log(addresses);
    res.render("usersViews/checkout", { addresses, products, couponDoc });
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

const loadWallet = async (req, res) => {
  try {
    const { id } = req.session.user;
    const wallet = await Wallet.findOne({ user: id });
    console.log(wallet);
    res.render("usersViews/wallet", { wallet });
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
  renderRegisterForm,
  initiateUserRegister,
  loadValidateOTP,
  verifyOTP,

  renderForgotPasswordForm,
  initiateForgotPassword,
  verifyForgotPasswordOTP,
  resendOTP,
  updatePassword,
  loadShop,
  loadCategoryShop,
  loadProduct,
  fetchVariants,
  loadProfile,
  editProfile,
  loadCheckOut,
  loadPassword,
  changePassword,
  loadWallet,
  logout,
};
