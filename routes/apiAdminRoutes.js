const express = require("express");
const router = express.Router();

const {
  addCategory,
  editCategory,
  changeCategoryStatus,
} = require("../controllers/categoryController");

const { changeUserStatus } = require("../controllers/usersController");

const { changeProductStatus } = require("../controllers/productController");

router.post("/categories/add", addCategory);
router.put("/categories/:id", editCategory);
router.patch("/categories/:id", changeCategoryStatus);

router.patch("/products/:id", changeProductStatus);

router.patch("/users/:id", changeUserStatus);

module.exports = router;
