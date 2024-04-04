const express = require("express");
const router = express.Router();

const { upload } = require("../config/multerConfig");

const {
  loadLogin,
  authenticateAdmin,
  registerAdmin,
  logout,
} = require("../controllers/admin/authContoller");
const {
  loadUsers,
  loadSingleUser,
  changeUserStatus,
} = require("../controllers/admin/userManagementController");

const {
  getSubCategory,
  loadOrders,
  loadSingleOrder,
  updateOrderStatus,
  loadDiscount,
  loadAddDiscount,
  getProducts,
  getCategories,
  createDiscount,
  getOffers,
} = require("../controllers/admin/adminController");

const {
  loadDashboard,
  renderSalesChart,
  renderPieChart,
  loadSales,
  generateSales,
} = require("../controllers/admin/dashboardController");

const {
  loadProducts,
  loadAddProduct,
  addProduct,
  loadEditProduct,
  editProduct,
  changeProductStatus,
} = require("../controllers/admin/productController");

const {
  loadCategory,
  loadAddCategory,
  addCategory,
  loadEditCategory,
  editCategory,
  changeCategoryStatus,
} = require("../controllers/admin/categoryController");

const {
  renderAttributes,
  renderAddAttributes,
} = require("../controllers/admin/attributeController");

const {
  renderCoupon,
  renderAddCoupon,
  generateCoupon,
  createCoupon,
  loadEditCoupon,
  editCoupon,
} = require("../controllers/admin/couponController");

const {
  removeOffer,
  applyProductOffer,
  removeProductOffer,
  applyCategoryOffer,
  removeCategoryOffer,
  loadEditOffer,
  editOffer,
} = require("../controllers/admin/offerController");

const { isLogin, isLogout } = require("../middleware/authAdmin");

/* GET home page. */
router.get("/", isLogout, loadLogin);
router.post("/login", isLogout, authenticateAdmin);
router.post("/register", isLogout, registerAdmin);

// Dashboard
router.get("/dashboard", isLogin, loadDashboard);
router.get("/sales-chart/:period", isLogin, renderSalesChart);
router.get("/pie-chart", isLogin, renderPieChart);

router.get("/sales", isLogin, loadSales);
router.get("/generate-report", isLogin, generateSales);

//Product
router.get("/products", isLogin, loadProducts);
router.get("/add-product", isLogin, loadAddProduct);
router.post("/subcategory", isLogin, getSubCategory);
router.post("/add-product", isLogin, upload.any(), addProduct);
router.get("/edit-product/:id", isLogin, loadEditProduct);
router.put("/edit-product/:id", isLogin, upload.any(), editProduct);

//category
router.get("/category", isLogin, loadCategory);
router.get("/getCategories", isLogin, getCategories);
router.get("/add-category", isLogin, loadAddCategory);
router.post("/add-category", isLogin, addCategory);
router.get("/edit-category/:id", isLogin, loadEditCategory);
router.put("/edit-category/:id", isLogin, editCategory);
// router.patch()

//orders
router.get("/orders", isLogin, loadOrders);
router.get("/orders/:orderId", isLogin, loadSingleOrder);
router.patch("/updateOrder", isLogin, updateOrderStatus);

//users
router.get("/users", isLogin, loadUsers);
router.get("/users/:id", isLogin, loadSingleUser);
router.patch("/users/:id", changeUserStatus);

//discount offer
router.get("/offers", isLogin, loadDiscount);
router.get("/add-offer", isLogin, loadAddDiscount);
router.get("/get_products", isLogin, getProducts);

// router.get("/get_categories", isLogin, getCategories);

router.post("/create-discount", isLogin, createDiscount);

router.post("/remove-discount", isLogin, removeOffer);
router.get("/getOffers", isLogin, getOffers);

router.post("/apply-product-offer", isLogin, applyProductOffer);
router.post("/remove-product-offer", isLogin, removeProductOffer);

router.post("/apply-category-offer", isLogin, applyCategoryOffer);
router.post("/remove-category-offer", isLogin, removeCategoryOffer);

router.get("/edit-offer/:id", isLogin, loadEditOffer);
router.put("/edit-offer/:id", isLogin, editOffer);

//Coupon
router.get("/coupon", isLogin, renderCoupon);
router.get("/add-coupon", isLogin, renderAddCoupon);
router.get("/generate-coupon", isLogin, generateCoupon);
router.post("/create-coupon", isLogin, createCoupon);
router.get("/edit-coupon/:id", isLogin, loadEditCoupon);
router.put("/edit-coupon/:id", isLogin, editCoupon);

//Attribute
router.get("/attributes", isLogin, renderAttributes);
router.get("/add-attributes", isLogin, renderAddAttributes);

router.get("/logout", logout);

module.exports = router;
