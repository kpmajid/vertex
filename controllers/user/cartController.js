const Cart = require("../../models/Cart");
const Category = require("../../models/Category");
const Product = require("../../models/Product");

const addToCart = async (req, res) => {
  try {
    console.log("addToCart");
    if (!req.session.user) {
      return res.status(401).json({ error: "Please login" });
    }

    const { id } = req.session.user;
    const { productId, color, size } = req.body;

    console.log(productId, color, size);

    const existingProduct = await Cart.findOne({
      userId: id,
      products: {
        $elemMatch: {
          productId: productId,
          color: color,
          size: size,
        },
      },
    });
    console.log(existingProduct);
    if (existingProduct) {
      return res.status(409).json({ message: "product is already in cart" });
    }

    const cart = await Cart.findOne({ userId: id });
    cart.products.push({ productId, color, size });
    await cart.save();

    return res
      .status(200)
      .json({ message: "Product added to the cart successfully", cart });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error." });
  }
};

const loadCart = async (req, res) => {
  try {
    const { id } = req.session.user;
    const userCart = await Cart.findOne({ userId: id }).populate(
      "products.productId",
      "-description"
    );
    console.log(userCart);
    for (const cartProduct of userCart.products) {
      const product = cartProduct.productId;

      console.log(product);

      if (product.status !== "listed") {
        cartProduct.message = "Product is unavailable";
        continue;
      }

      const parentCategory = await Category.findById(
        product.category.parentCategory
      );

      if (parentCategory && parentCategory.status !== "listed") {
        cartProduct.message = "Product is unavailable";
        continue;
      }

      // Check if sub category is unlisted
      const subCategory = await Category.findById(product.category.subCategory);
      if (subCategory && subCategory.status !== "listed") {
        cartProduct.message = "Product is unavailable";
        continue;
      }

      if (
        product.variants.some(
          (variant) =>
            variant.color === cartProduct.color &&
            variant.size === cartProduct.size &&
            variant.quantity == 0
        )
      ) {
        cartProduct.message = "Out Of Stock";
        continue;
      }

      if (
        product.variants.some(
          (variant) =>
            variant.color === cartProduct.color &&
            variant.size === cartProduct.size &&
            variant.quantity < cartProduct.quantity
        )
      ) {
        cartProduct.message = "We do not have enough stock";
        continue;
      }
    }

    const products = userCart?.products || null;
    console.log("products");
    console.log(products);
    res.render("usersViews/cart", { products });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error." });
  }
};

const removeProduct = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: "User not authenticated." });
    }

    const { id } = req.session.user;

    const { itemId } = req.body;
    if (!itemId) {
      return res
        .status(400)
        .json({ error: "itemId is missing in the request." });
    }

    const cart = await Cart.updateOne(
      { userId: id },
      {
        $pull: {
          products: {
            _id: itemId,
          },
        },
      }
    );

    //number of documents modified
    if (cart.nModified === 0) {
      return res.status(404).json({ error: "Item not found in the cart." });
    }

    // Successful response
    return res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error." });
  }
};

const updateQuantity = async (req, res) => {
  try {
    const { itemId, change } = req.body;
    const { id } = req.session.user;

    const item = await Cart.findOne(
      { userId: id, "products._id": itemId },
      { "products.$": 1 }
    );

    const { productId, color, size, quantity } = item.products[0];

    // console.log(productId, color, size, quantity);

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ error: "Item not found in the cart." });
    }

    const variant = product.variants.find(
      (v) => v.color === color && v.size === size
    );

    const newQuantity = quantity + parseInt(change, 10);

    console.log(newQuantity);

    if (newQuantity <= 0) {
      return res.status(400).json({ message: "Invalid quantity change." });
    }

    if (variant.quantity < newQuantity && change == 1) {
      console.log("less than");
      return res.status(400).json({ message: "Insufficient stock." });
    }

    await Cart.updateOne(
      { userId: id, "products._id": itemId },
      { $set: { "products.$.quantity": newQuantity } }
    );

    if (newQuantity > variant.quantity) {
      errorMessage = "We do not have enough stock";
    } else {
      errorMessage = null;
    }

    return res.json({ success: true, errorMessage });

    // Successful response
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { loadCart, addToCart, removeProduct, updateQuantity };
