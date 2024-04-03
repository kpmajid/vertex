const Product = require("../../models/Product");
const Category = require("../../models/Category");
const Cart = require("../../models/Cart");
const Address = require("../../models/Address");
const Coupons = require("../../models/Coupons");

const mongoose = require("mongoose");

const { ObjectId } = require("mongodb");

const loadHome = (req, res) => {
  const user = req.session?.user ?? null;
  res.render("usersViews/index", { user });
};

const loadShop = async (req, res) => {
  try {
    const user = req.session?.user ?? null;

    let categoriesQuery;
    if (req.query.categories) {
      categoriesQuery = Array.isArray(req.query.categories)
        ? req.query.categories
        : [req.query.categories];
    }

    const minPrice = req.query?.min || "";
    const maxPrice = req.query?.max || "";

    const sort = req.query?.sort || "";

    let query = [
      {
        $lookup: {
          from: "categories",
          localField: "category.parentCategory",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
    ];

    if (categoriesQuery) {
      query.push({
        $match: {
          "category.name": { $in: categoriesQuery },
        },
      });
      console.log(categoriesQuery);
    }

    if (minPrice && maxPrice) {
      query.push({
        $match: {
          originalPrice: { $gte: parseInt(minPrice), $lte: parseInt(maxPrice) },
        },
      });
      console.log(typeof minPrice, typeof maxPrice);
    }

    if (sort == "lowToHigh") {
      query.push({
        $sort: {
          originalPrice: 1,
        },
      });
    } else if (sort == "highToLow") {
      query.push({
        $sort: {
          originalPrice: -1,
        },
      });
    }

    console.log("query");
    console.log(query);

    query.push(
      {
        $lookup: {
          from: "discounts",
          localField: "discountId",
          foreignField: "_id",
          as: "discountDetails",
        },
      },
      {
        $unwind: {
          path: "$discountDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          name: 1,
          originalPrice: 1,
          discountedPrice: 1,
          discount: 1,
          discountPercent: "$discountDetails.value",
          images: 1,
        },
      }
    );

    const products = await Product.aggregate(query);

    const categories = await Category.aggregate([
      {
        $match: {
          isParentCategory: true,
          status: "listed",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "subcategories",
          foreignField: "_id",
          as: "subcategories",
        },
      },
    ]);

    console.log(categories);
    console.log(products);
    console.log(products.length);
    let currentPage = 2;

    res.render("usersViews/shop", { products, categories, user, currentPage });
  } catch (error) {
    console.log(error);
  }
};

const loadCategoryShop = async (req, res) => {
  try {
    const user = req.session?.user ?? null;
    const category = req.params.category;
    console.log(category);
    const products = await Product.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "category.parentCategory",
          foreignField: "_id",
          as: "parentCategory",
        },
      },
      {
        $lookup: {
          from: "discounts",
          localField: "discountId",
          foreignField: "_id",
          as: "discountDetails",
        },
      },
      {
        $unwind: {
          path: "$discountDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category.subCategory",
          foreignField: "_id",
          as: "subCategory",
        },
      },
      {
        $match: {
          status: "listed",
          "parentCategory.name": category,
          "parentCategory.status": "listed",
          "subCategory.status": "listed",
        },
      },
      {
        $project: {
          name: 1,
          originalPrice: 1,
          discountedPrice: 1,
          discount: 1,
          discountPercent: "$discountDetails.value",
          images: 1,
        },
      },
    ]);

    const categories = await Category.find({
      isParentCategory: true,
      name: category,
    })
      .populate({
        path: "subcategories",
        select: "name",
        match: { status: "listed" },
      })
      .exec();
    console.log("products");
    console.log(products);
    console.log("Categories");
    console.log(categories);

    res.render("usersViews/shop", { products, categories, user });
  } catch (error) {
    res.status(500).render("error", { error: error.message });
  }
};

const loadSearch = async (req, res) => {
  try {
    const user = req.session?.user ?? null;
    const { keyword, sort } = req.query;

    let query = [
      {
        $match: {
          name: {
            $regex: keyword,
            $options: "i",
          },
        },
      },
    ];
    if (sort == "lowToHigh") {
      query.push({
        $sort: {
          originalPrice: 1,
        },
      });
    } else if (sort == "highToLow") {
      query.push({
        $sort: {
          originalPrice: -1,
        },
      });
    }
    console.log(query);
    const products = await Product.aggregate(query);
    console.log(products);
    res.render("usersViews/search", { user, products, keyword });
  } catch (error) {
    console.log(error);
    res.status(500).render("error", { error: error.message });
  }
};

const loadProduct = async (req, res) => {
  try {
    console.log("working?");
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).render("404");
    }
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).render("404");
    }

    console.log(product);
    const uniqueColorsWithQuantity = product.variants
      .filter((variant) => variant.quantity > 0)
      .map((variant) => variant.color);

    console.log(uniqueColorsWithQuantity);
    const uniqueColors = [...new Set(uniqueColorsWithQuantity)];
    console.log(uniqueColors);
    const user = req.session?.user ?? null;
    res.render("usersViews/product", { product, uniqueColors, user });
  } catch (error) {
    console.log(error);
  }
};

const fetchVariants = async (req, res) => {
  try {
    const id = req.params.id;
    const selectedColor = req.params.color;

    const result = await Product.findOne(
      { _id: id },
      {
        variants: {
          $filter: {
            input: "$variants",
            as: "variant",
            cond: { $eq: ["$$variant.color", selectedColor] },
          },
        },
      }
    );
    const variants = result.variants;

    res.json({ variants });
  } catch (error) {
    console.log(error);
  }
};

// const loadCart = async (req, res) => {
//   try {
//     const { id } = req.session.user;
//     const cartItems = await Cart.aggregate([
//       {
//         $match: {
//           userId: new ObjectId("65d25b7ffea88e9a743cc4f2"),
//         },
//       },
//       {
//         $unwind: {
//           path: "$products",
//         },
//       },
//       {
//         $lookup: {
//           from: "products",
//           localField: "products.productId",
//           foreignField: "_id",
//           as: "products.details",
//         },
//       },
//       {
//         $unwind: {
//           path: "$products.details",
//         },
//       },
//       {
//         $project: {
//           name: "$products.details.name",
//           color: "$products.color",
//           size: "$products.size",
//           quantity: "$products.quantity",
//           image: "$products.details.images",
//           discountedPrice: "$products.details.discountedPrice",
//           originalPrice: "$products.details.originalPrice",
//         },
//       },
//     ]);
//     console.log(cartItems);
//     res.send(cartItems);
//   } catch (error) {
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

// const loadCart = async (req, res) => {
//   try {
//     const { id } = req.session.user;
//     const cart = await Cart.findOne({ userId: id }).populate(
//       "products.productId",
//       "-category -description -variants -status"
//     );
//     // console.log(cart);
//     const products = cart?.products || null;
//     res.render("usersViews/cart", { products });
//   } catch (error) {
//     console.log(error);
//   }
// };

const loadCheckOut = async (req, res) => {
  try {
    const { id } = req.session.user;
    const addressesDoc = await Address.findOne({ userId: id });
    const addresses = addressesDoc?.addresses ?? null;

    const cart = await Cart.findOne({ userId: id }).populate(
      "products.productId",
      "-description"
    );

    const products = cart.products;

    if (products.length <= 0) {
      res.status(400).redirect("/cart");
      return;
    }

    const coupon = req.session.coupon;
    let couponDoc;
    if (coupon.length > 0) {
      couponCode = couponCode.toUpperCase();
      couponDoc = await Coupons.findOne({ couponCode: couponCode });
    }
    // console.log("products loadCheclout");
    // console.log(products);

    console.log("addresses in load");
    console.log(addresses);
    res.render("usersViews/checkout", { addresses, products, couponDoc });
  } catch (error) {
    console.log(error);
  }
};

const logout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
    res.status(500).render("error", { error: error.message });
  }
};

module.exports = {
  loadHome,
  loadShop,
  loadCategoryShop,
  loadProduct,
  fetchVariants,
  loadCheckOut,
  loadSearch,
  logout,
};
