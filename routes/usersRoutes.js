const express = require("express");
const router = express.Router();

const { isBlocked } = require("../middleware/isBlocked");

const {
  loadHome,
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
} = require("../controllers/usersController");

const {
  loadAddress,
  removeAddress,
  loadAddAddress,
  addAddress,
  loadEditAddress,
  editAddress,
} = require("../controllers/addressController");

const {
  processCheckout,
  createOrder,
  LoadOrders,
  LoadSingleOrder,
  cancelOrder,
  cancelProducts,
} = require("../controllers/orderController");

const {
  loadWishlist,
  addToWishlist,
  removeProductFromWishlist,
} = require("../controllers/wishlistController");

const {
  loadCart,
  addToCart,
  removeProduct,
  updateQuantity,
} = require("../controllers/cartController");

const { checkCoupon } = require("../controllers/couponController");

const { isLogin, isLogout } = require("../middleware/authUser");

const { razorPayOrder, verifyPayment } = require("../controllers/razorpay");

router.get("/", loadHome);

router.get("/login", isLogout, loadLogin);
router.post("/login", isLogout, authUser);

router.get("/otp", loadValidateOTP);
router.post("/verifyOtp", verifyOTP);

router.get("/register", isLogout, renderRegisterForm);

router.post("/register", initiateUserRegister);

router.get("/register/otp", loadValidateOTP);

// router.get("/register", isLogout, loadRegister);
// router.post("/register", isLogout, registerUser);

router.get("/forgot-password", renderForgotPasswordForm);
router.post("/forgot-password", initiateForgotPassword);

router.post("/verify-forgot-password", verifyForgotPasswordOTP);

router.post("/update-password", updatePassword);

router.get("/resend", resendOTP);

router.get("/home", (req, res) => {
  res.send("verified successfully");
});

// router.use("/", isBlocked);

router.get("/shop", loadShop);
router.get("/shop/:category", loadCategoryShop);

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

router.post("/addToCart", addToCart);

router.delete("/removeProduct", isLogin, removeProduct);

router.patch("/updateQuantity", isLogin, updateQuantity);

router.post("/proceed-to-checkout", isLogin, processCheckout);

router.get("/checkout", isLogin, loadCheckOut);

//razor pay
router.post("/create/orderId", isLogin, razorPayOrder);

router.post("/verify-payment", isLogin, verifyPayment);

//razorpay end

router.post("/placeOrder", isLogin, createOrder);

router.get("/orders", isLogin, LoadOrders);

router.get("/orders/:orderId", isLogin, LoadSingleOrder);

router.patch("/cancelOrder", isLogin, cancelOrder);

router.post("/cancel-products", isLogin, cancelProducts);

router.get("/wishlist", isLogin, loadWishlist);
router.get("/addToWishlist/:id", addToWishlist);
router.delete("/wishlist/:productId", removeProductFromWishlist);

//coupon
router.post("/checkCoupon/:couponCode", checkCoupon);

router.get("/wallet", isLogin, loadWallet);

router.get("/logout", logout);

module.exports = router;
