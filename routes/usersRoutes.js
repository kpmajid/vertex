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

//forgot-password
router.get("/forgot-password", renderForgotPasswordForm);
router.post("/forgot-password", initiateForgotPassword);
router.post("/verify-forgot-password", verifyForgotPasswordOTP);
router.post("/update-password", updatePassword);

//resend OTP
router.get("/resend", resendOTP);

router.get("/shop", loadShop);

router.get("/search", loadSearch);

router.get("/product/:id", loadProduct);
router.get("/variants/:id/:color", fetchVariants);

//profile
router.get("/profile", isLogin, isBlocked, loadProfile);
router.patch("/profile", isLogin, isBlocked, editProfile);

//profile-password
router.get("/password", isLogin, isBlocked, loadPassword);
router.patch("/password", isLogin, isBlocked, changePassword);

//address
router.get("/address", isLogin, isBlocked, loadAddress);
router.delete("/removeAddress", isLogin, isBlocked, removeAddress);
router.get("/add-address", isLogin, isBlocked, loadAddAddress);
router.get("/address/:id", isLogin, isBlocked, loadEditAddress);
router.patch("/address/:id", isLogin, isBlocked, editAddress);
router.post("/add-address", isLogin, isBlocked, addAddress);

//cart
router.get("/cart", isLogin, isBlocked, loadCart);
router.post("/addToCart", isLogin, isBlocked, addToCart);
router.delete("/removeProduct", isLogin, isBlocked, removeProduct);
router.patch("/updateQuantity", isLogin, isBlocked, updateQuantity);
router.post("/proceed-to-checkout", isLogin, isBlocked, processCheckout);

//checkout
router.get("/checkout", isLogin, isBlocked, loadCheckOut);

//razor pay
router.post("/create/orderId", isLogin, isBlocked, razorPayOrder);
router.post("/verify-payment", isLogin, isBlocked, verifyPayment);

//razorpay end

//order
router.post("/placeOrder", isLogin, isBlocked, createOrder);
router.get("/checkout-success/:id", isLogin, isBlocked, loadSuccessCheckout);

router.get("/orders", isLogin, isBlocked, LoadOrders);
router.get("/orders/:orderId", isLogin, isBlocked, LoadSingleOrder);
router.patch("/cancelOrder", isLogin, isBlocked, cancelOrder);
router.post("/cancel-products", isLogin, isBlocked, cancelProducts);
router.post("/return-products", isLogin, isBlocked, returnProducts);
router.get("/invoice/:id", isLogin, isBlocked, invoice);
router.post("/pay", isLogin, isBlocked, pay);

//wishlist
router.get("/wishlist", isLogin, isBlocked, loadWishlist);
router.get("/addToWishlist/:id", isLogin, isBlocked, addToWishlist);
router.delete(
  "/wishlist/:productId",
  isLogin,
  isBlocked,
  removeProductFromWishlist
);

//coupon
router.post("/checkCoupon/:couponCode", isLogin, isBlocked, checkCoupon);

router.get("/wallet", isLogin, isBlocked, loadWallet);

router.get("/blocked", (req, res) => {
  res.status(404).render("blocked");
});

router.get("/logout", logout);

module.exports = router;
