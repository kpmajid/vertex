const express = require("express");
const router = express.Router();

const {
  addCategory,
  editCategory,
  changeCategoryStatus,
} = require("../controllers/admin/categoryController");

const { changeUserStatus } = require("../controllers/user/usersController");

const {
  changeProductStatus,
} = require("../controllers/admin/productController");

router.post("/categories/add", addCategory);
router.put("/categories/:id", editCategory);
router.patch("/categories/:id", changeCategoryStatus);

router.patch("/products/:id", changeProductStatus);



module.exports = router;
