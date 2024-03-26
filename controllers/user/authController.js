const User = require("../../models/User");
const Otp = require("../../models/OTP");

const Wallet = require("../../models/Wallet");
const Wishlist = require("../../models/Wishlist");
const Cart = require("../../models/Cart");
const Address = require("../../models/Address");

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
    const { name, email, mobile, password, ref } = req.body;

    console.log("name, email, mobile, password, ref");
    console.log(name, email, mobile, password, ref);

    if (!name || !email || !password || !mobile) {
      return res
        .status(400)
        .json({ status: "error", message: "please provide information" });
    }

    //checking if user already exist?
    const isExist = await User.findOne({ email });
    if (isExist) {
      console.log(isExist);
      return res.status(409).json({
        status: "error",
        message: `User with ${email} id already exist`,
      });
    }

    console.log(mobile);
    console.log(typeof mobile);
    const isPhoneUnique = await User.findOne({ mobile });
    console.log(isPhoneUnique);
    if (isPhoneUnique) {
      return res.status(409).json({
        status: "error",
        message: `User with ${mobile} already exist`,
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
      return res
        .status(500)
        .json({ status: "error", message: "Failed to send email" });
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

    res
      .status(200)
      .json({ status: "success", message: "user created successfully!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: "error", message: "Internal Sever error" });
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

module.exports = {
  loadLogin,
  authUser,
  renderRegisterForm,
  initiateUserRegister,
  loadValidateOTP,
  verifyOTP,
  renderForgotPasswordForm,
  initiateForgotPassword,
  updatePassword,
  verifyForgotPasswordOTP,
  resendOTP,
};
