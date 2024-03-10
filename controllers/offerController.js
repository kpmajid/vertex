const Product = require("../models/Product");
const Category = require("../models/Category");
const Discounts = require("../models/Discounts");

const applyProductOffer = async (req, res) => {
  try {
    console.log("ehid");
    const { productId, offerId } = req.body;
    const offer = await Discounts.findOne({
      _id: offerId,
      end: { $gte: new Date() },
    });

    if (!offer) {
      res.status(400).json({ message: "No offer found" });
    }

    const product = await Product.findById(productId);
    product.discountId = offer._id;

    const discount = product.originalPrice * (offer.value / 100);

    product.discount = discount;
    product.discountedPrice = product.originalPrice - discount;

    await product.save();

    res.status(200).json({ message: "Offer applied" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const removeProductOffer = async (req, res) => {
  try {
    console.log("removeProductOffer");
    const { productId } = req.body;
    console.log(productId);
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    console.log(product);
    // Check if product has a discount
    if (product.discount) {
      // If discount exists, remove it and reset discountedPrice
      product.discountId = null;
      product.discount = null;
      product.discountedPrice = null;
    }
    await product.save();

    res.status(200).json({ message: "offer removed" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const applyCategoryOffer = async (req, res) => {
  try {
    const { categoryId, offerId } = req.body;

    const offer = await Discounts.findOne({
      _id: offerId,
      end: { $gte: new Date() },
    });

    if (!offer) {
      res.status(400).json({ message: "No offer found" });
    }

    console.log(categoryId, offerId);
    const category = await Category.findById(categoryId);

    if (!category) {
      res.status(400).json({ message: "No category found" });
    }

    category.discount = offer._id;

    const productsToUpdate = await Product.find({
      $or: [
        { "category.parentCategory": category._id },
        { "category.subCategory": category._id },
      ],
    });

    if (!productsToUpdate) {
      res.status(400).json({ message: "No products found" });
    }

    for (const product of productsToUpdate) {
      product.discountId = offer._id;

      const discount = product.originalPrice * (offer.value / 100);

      product.discount = discount;
      product.discountedPrice = product.originalPrice - discount;

      await product.save();
      console.log("saved product");
    }

    await category.save();
    res.status(200).json({ message: "Offer applied" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const removeCategoryOffer = async (req, res) => {
  try {
    const { categoryId } = req.body;
    console.log("categoryId");
    console.log(categoryId);
    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    productsToUpdate = await Product.find({
      $or: [
        { "category.parentCategory": category._id },
        { "category.subCategory": category._id },
      ],
      discountId: category.discount,
    });

    for (const product of productsToUpdate) {
      product.discountId = null;
      product.discount = null;
      product.discountedPrice = null;
      await product.save();
    }

    category.discount = null;
    await category.save();
    res.status(200).json({ message: "offer removed" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const loadEditOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await Discounts.findById(id);
    console.log(offer);
    res.render("adminViews/edit-offer", { offer });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const editOffer = async (req, res) => {
  try {
    const { id } = req.params;

    const { name, discountPercentage, start, end } = req.body;

    const offerDoc = await Discounts.findById(id);

    if (!offerDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Offer not found." });
    }

    offerDoc.name = name;
    offerDoc.value = discountPercentage;
    offerDoc.start = start;
    offerDoc.end = end;

    await offerDoc.save();
    res.json({ success: true, message: "Offer Updated" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  applyProductOffer,
  removeProductOffer,
  applyCategoryOffer,
  removeCategoryOffer,
  loadEditOffer,
  editOffer,
};
