const express = require("express");
const router = express.Router();

const path = require("path");
const fs = require("fs");

const multer = require("multer");

const uploadFolder = "../public/img/products/";
const absoluteUploadPath = path.join(__dirname, uploadFolder);

if (!fs.existsSync(absoluteUploadPath)) {
  fs.mkdirSync(absoluteUploadPath);
}

let productImageCounter = {};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log("Destination function called");
    cb(null, absoluteUploadPath);
  },
  filename: function (req, file, cb) {
    console.log("Filename function called");
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

const {
  loadLogin,
  authenticateAdmin,
  registerAdmin,
  getSubCategory,
  loadOrders,
  loadSingleOrder,
  updateOrderStatus,
  loadUsers,
  loadSingleUser,
  loadDiscount,
  loadAddDiscount,
  getProducts,
  getCategories,
  createDiscount,
  removeDiscount,
  getOffers,

  logout,
} = require("../controllers/adminController");

const {
  loadDashboard,
  renderSalesChart,
} = require("../controllers/dashboardController");

const {
  loadProducts,
  loadAddProduct,
  addProduct,
  loadEditProduct,
  editProduct,
  changeProductStatus,
} = require("../controllers/productController");

const {
  loadCategory,
  loadAddCategory,
  addCategory,
  loadEditCategory,
  editCategory,
  changeCategoryStatus,
} = require("../controllers/categoryController");

const {
  renderAttributes,
  renderAddAttributes,
} = require("../controllers/attributeController");

const {
  renderCoupon,
  renderAddCoupon,
  generateCoupon,
  createCoupon,
  loadEditCoupon,
  editCoupon,
} = require("../controllers/couponController");

const {
  applyProductOffer,
  removeProductOffer,
  applyCategoryOffer,
  removeCategoryOffer,
  loadEditOffer,
  editOffer,
} = require("../controllers/offerController");

const { isLogin, isLogout } = require("../middleware/authAdmin");

/* GET home page. */
router.get("/", isLogout, loadLogin);
router.post("/login", isLogout, authenticateAdmin);
router.post("/register", isLogout, registerAdmin);

// Dashboard
router.get("/dashboard", isLogin, loadDashboard);
router.get("/sales-chart/:period", isLogin, renderSalesChart);

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

//discount offer
router.get("/discount", isLogin, loadDiscount);
router.get("/add-discount", isLogin, loadAddDiscount);
router.get("/get_products", isLogin, getProducts);

// router.get("/get_categories", isLogin, getCategories);

router.post("/create-discount", isLogin, createDiscount);

router.post("/remove-discount", isLogin, removeDiscount);
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
