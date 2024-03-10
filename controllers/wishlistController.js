const Wishlist = require("../models/Wishlist");

const { ObjectId } = require("mongodb");

const loadWishlist = async (req, res) => {
  try {
    const { id } = req.session.user;

    const wishlistDoc = await Wishlist.aggregate([
      {
        $match: {
          user: new ObjectId(id),
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "wishlist",
          foreignField: "_id",
          as: "wishlist",
        },
      },
    ]);
    console.log(wishlistDoc);
    const products = wishlistDoc[0].wishlist;

    console.log(products);
    res.render("usersViews/wishlist", { products });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addToWishlist = async (req, res) => {
  try {
    console.log("addTOwishlist");
    if (!req.session.user) {
      return res.status(401).json({ error: "Please login" });
    }
    const productId = req.params.id;
    const { id } = req.session.user;
    console.log(productId);

    const existingProduct = await Wishlist.findOne({
      user: id,
      wishlist: { $in: [productId] },
    });
    console.log(existingProduct);
    if (existingProduct) {
      return res
        .status(409)
        .json({ message: "product is already in wishlist" });
    }

    const wishlistDoc = await Wishlist.findOne({ user: id });

    wishlistDoc.wishlist.push(productId);
    await wishlistDoc.save();
    res.status(200).json({ message: "added to wishlist" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const removeProductFromWishlist = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: "Please login" });
    }
    const { id } = req.session.user;
    const productId = req.params.productId;

    const wishlist = await Wishlist.updateOne(
      { user: id },
      {
        $pull: {
          wishlist: productId,
        },
      }
    );

    if (wishlist.nModified === 0) {
      return res.status(404).json({ error: "Item not found in the wishlist." });
    }

    // Successful response
    return res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  loadWishlist,
  addToWishlist,
  removeProductFromWishlist,
};
