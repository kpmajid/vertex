const express = require("express");
const router = express.Router();

const { isBlocked } = require("../middleware/isBlocked");

const {
  loadHome,
  loadLogin,
  authUser,
  loadRegister,
  registerUser,
  loadValidateOTP,
  verifyOTP,
  renderForgotPasswordForm,
  initiateForgotPassword,
  updatePassword,
  verifyForgotPasswordOTP,
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
} = require("../controllers/usersController");

const { isLogin, isLogout } = require("../middleware/authUser");

const { razorPayOrder, verifyPayment } = require("../controllers/razorpay");

router.get("/", loadHome);

router.get("/login", isLogout, loadLogin);
router.post("/login", isLogout, authUser);

router.get("/register", isLogout, loadRegister);
router.post("/register", isLogout, registerUser);

router.get("/register/otp", isLogout, loadValidateOTP);
router.post("/register/otp", isLogout, verifyOTP);

router.get("/forgot-password", renderForgotPasswordForm);
router.post("/forgot-password", initiateForgotPassword);

router.post("/verify-forgot-password", verifyForgotPasswordOTP);

router.post("/update-password", updatePassword);

router.get("/home", (req, res) => {
  res.send("verified successfully");
});

// router.use("*", isBlocked);

router.get("/shop", loadShop);

router.get("/product/:id", loadProduct);

router.get("/variants/:id/:color", fetchVariants);

router.get("/profile", isLogin, loadProfile);

router.patch("/profile", isLogin, editProfile);

router.get("/password", isLogin, loadPassword);

router.patch("/password", isLogin, changePassword);

router.get("/address", isLogin, loadAddress);

router.delete("/removeAddress", removeAddress);

router.get("/add-address", isLogin, loadAddAddress);

router.get("/address/:id", isLogin, loadEditAddress);

router.patch("/address/:id", isLogin, editAddress);

router.post("/add-address", isLogin, addAddress);

router.get("/cart", isLogin, loadCart);

router.post("/addToCart", isLogin, addToCart);

router.delete("/removeProduct", isLogin, removeProduct);

router.patch("/updateQuantity", isLogin, updateQuantity);

router.get("/checkout", isLogin, loadCheckOut);

//razor pay
router.post("/create/orderId", isLogin, razorPayOrder);

router.post("/verify-payment", isLogin, verifyPayment);

router.post("/placeOrder", isLogin, createOrder);

router.get("/orders", isLogin, LoadOrders);

router.get("/orders/:orderId", isLogin, LoadSingleOrder);

router.patch("/cancelOrder", isLogin, cancelOrder);

router.get("/logout", logout);

module.exports = router;
