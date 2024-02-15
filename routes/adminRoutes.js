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
} = require("../controllers/adminController");

const { isLogin, isLogout } = require("../middleware/authAdmin");

/* GET home page. */
router.get("/", isLogout, loadLogin);
router.post("/login", isLogout, authenticateAdmin);
router.post("/register", isLogout, registerAdmin);

router.get("/dashboard", isLogin, loadDashboard);

router.get("/products", isLogin, loadProducts);

router.get("/add-product", isLogin, loadAddProduct);

router.post("/subcategory", isLogin, getSubCategory);

router.post("/add-product", isLogin, upload.array("images[]", 4), addProduct);

router.get("/edit-product/:id", isLogin, loadEditProduct);

router.put(
  "/edit-product/:id",
  isLogin,
  upload.array("images[]", 4),
  editProduct
);

router.get("/category", isLogin, loadCategory);

router.get("/orders", isLogin, loadOrders);
router.get("/orders/:orderId", isLogin, loadSingleOrder);

router.patch("/updateOrder",isLogin,updateOrderStatus)

router.get("/users", isLogin, loadUsers);

router.get("/users/:id", isLogin, loadSingleUser);

router.get("/logout", logout);

module.exports = router;
