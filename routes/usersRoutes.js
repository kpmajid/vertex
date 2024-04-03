const express = require("express");
const router = express.Router();

const { isBlocked } = require("../middleware/isBlocked");

const {
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
} = require("../controllers/user/authController");

const {
  loadProfile,
  editProfile,
  loadWallet,
} = require("../controllers/user/profileContoller");

const {
  loadPassword,
  changePassword,
} = require("../controllers/user/passwordController");

const {
  loadHome,
  loadShop,
  loadSearch,
  loadCategoryShop,
  loadProduct,
  fetchVariants,
  loadCheckOut,
  logout,
} = require("../controllers/user/usersController");

const {
  loadAddress,
  removeAddress,
  loadAddAddress,
  addAddress,
  loadEditAddress,
  editAddress,
} = require("../controllers/user/addressController");

const {
  processCheckout,
  createOrder,
  loadSuccessCheckout,
  LoadOrders,
  LoadSingleOrder,
  cancelOrder,
  cancelProducts,
  returnProducts,
  invoice,
  pay,
} = require("../controllers/user/orderController");

const {
  loadWishlist,
  addToWishlist,
  removeProductFromWishlist,
} = require("../controllers/user/wishlistController");

const {
  loadCart,
  addToCart,
  removeProduct,
  updateQuantity,
} = require("../controllers/user/cartController");

const { checkCoupon } = require("../controllers/user/couponController");

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

//forgot-password
router.get("/forgot-password", renderForgotPasswordForm);
router.post("/forgot-password", initiateForgotPassword);
router.post("/verify-forgot-password", verifyForgotPasswordOTP);
router.post("/update-password", updatePassword);

//resend OTP
router.get("/resend", resendOTP);

// router.use("/", isBlocked);

router.get("/shop", loadShop);
router.get("/shop/:category", loadCategoryShop);

router.get("/search", loadSearch);

router.get("/product/:id", loadProduct);
router.get("/variants/:id/:color", fetchVariants);

//profile
router.get("/profile", isLogin, loadProfile);
router.patch("/profile", isLogin, editProfile);

//profile-password
router.get("/password", isLogin, loadPassword);
router.patch("/password", isLogin, changePassword);

//address
router.get("/address", isLogin, loadAddress);
router.delete("/removeAddress", removeAddress);
router.get("/add-address", isLogin, loadAddAddress);
router.get("/address/:id", isLogin, loadEditAddress);
router.patch("/address/:id", isLogin, editAddress);
router.post("/add-address", isLogin, addAddress);

//cart
router.get("/cart", isLogin, loadCart);
router.post("/addToCart", addToCart);
router.delete("/removeProduct", isLogin, removeProduct);
router.patch("/updateQuantity", isLogin, updateQuantity);
router.post("/proceed-to-checkout", isLogin, processCheckout);

//checkout
router.get("/checkout", isLogin, loadCheckOut);

//razor pay
router.post("/create/orderId", isLogin, razorPayOrder);
router.post("/verify-payment", isLogin, verifyPayment);

//razorpay end

//order
router.post("/placeOrder", isLogin, createOrder);
router.get("/checkout-success/:id", isLogin, loadSuccessCheckout);

router.get("/orders", isLogin, LoadOrders);
router.get("/orders/:orderId", isLogin, LoadSingleOrder);
router.patch("/cancelOrder", isLogin, cancelOrder);
router.post("/cancel-products", isLogin, cancelProducts);
router.post("/return-products", isLogin, returnProducts);
router.get("/invoice/:id", isLogin, invoice);
router.post("/pay", isLogin, pay);

//wishlist
router.get("/wishlist", isLogin, loadWishlist);
router.get("/addToWishlist/:id", addToWishlist);
router.delete("/wishlist/:productId", removeProductFromWishlist);

//coupon
router.post("/checkCoupon/:couponCode", checkCoupon);

router.get("/wallet", isLogin, loadWallet);

router.get("/logout", logout);

module.exports = router;
