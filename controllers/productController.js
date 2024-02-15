const Product = require("../models/Product");

const changeProductStatus = async (req, res) => {
  try {
    const id = req.params.id;

    const product = await Product.findById(id);

    if (!product) {
      res.status(404).json({ success: false, message: "Product not found." });
    }

    const newStatus = product.status === "listed" ? "unlisted" : "listed";

    await Product.findByIdAndUpdate(id, {
      $set: { status: newStatus },
    });

    res.json({ success: true, message: "Product status updated." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  changeProductStatus,
};
