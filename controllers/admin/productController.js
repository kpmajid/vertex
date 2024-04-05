const Product = require("../../models/Product");
const Category = require("../../models/Category");
const Discounts = require("../../models/Discounts");

const loadProducts = async (req, res) => {
  try {
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
          from: "categories",
          localField: "category.subCategory",
          foreignField: "_id",
          as: "subCategory",
        },
      },
      {
        $lookup: {
          from: "discounts",
          localField: "discountId",
          foreignField: "_id",
          as: "discount",
        },
      },
      {
        $unwind: "$parentCategory",
      },
      {
        $unwind: "$subCategory",
      },
      {
        $unwind: {
          path: "$discount",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          originalPrice: 1,
          discountedPrice: 1,
          status: 1,
          parentCategory: "$parentCategory.name",
          subCategory: "$subCategory.name",
          totalQuantity: {
            $sum: "$variants.quantity",
          },
          discount: {
            $cond: {
              if: {
                $or: [
                  {
                    $eq: [{ $type: "$discount" }, "missing"],
                  },
                  {
                    $eq: [{ $type: "$discount" }, "null"],
                  },
                ],
              },
              then: null,
              else: "$discount",
            },
          },
        },
      },
    ]);
    const offers = await Discounts.find({ end: { $gte: new Date() } });
    res.render("adminViews/products", { products, offers });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error." });
  }
};

const loadAddProduct = async (req, res) => {
  try {
    const categories = await Category.find({
      isParentCategory: true,
    });

    res.render("adminViews/add-product", { categories });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error." });
  }
};

const addProduct = async (req, res) => {
  try {
    const files = req.files;
    const images = files.map((file) => file.filename);

    const {
      name,
      description,
      price,
      parentCategory,
      subCategory,
      combinations,
    } = req.body;

    const variants = JSON.parse(combinations);

    const product = new Product({
      name,
      description: description.trim(),
      originalPrice: price,
      variants,
      category: {
        parentCategory: parentCategory,
        subCategory: subCategory,
      },
      images,
    });
    await product.save();

    res.json({ message: "product created successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error." });
  }
};

const loadEditProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Product.findById(id);

    //all parentCategories
    const parentCategories = await Category.find({ isParentCategory: true });

    //all subCategories which have parentCategory as product's parentCategory
    const subCategories = await Category.find({
      parentCategory: product.category.parentCategory,
    });

    res.render("adminViews/edit-product", {
      product,
      parentCategories,
      subCategories,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error." });
  }
};

const editProduct = async (req, res) => {
  try {
    console.log("edit product");
    console.log(req.body);

    const {
      name,
      description,
      price,
      parentCategory,
      subCategory,
      combinations,
      removedFiles,
    } = req.body;

    const id = req.params.id;

    const variants = JSON.parse(combinations);

    const removedFilesArray = JSON.parse(removedFiles);

    const product = await Product.findById(id);
    console.log("product:", product);

    if (removedFilesArray.length) {
      product.images = product.images.filter(
        (element) => !removedFilesArray.includes(element.split(".")[0])
      );
      console.log(removedFilesArray);
      const files = req.files;
      const images = files.map((file) => file.filename);
      console.log(images);
      product.images.push(...images);
    }

    product.name = name;
    product.description = description.trim();
    product.originalPrice = price;
    product.category.parentCategory = parentCategory;
    product.category.subCategory = subCategory;

    product.variants = variants;

    await product.save();
    console.log("saved");
    res.status(200).json({ message: "product updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error." });
  }
};

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
  loadProducts,
  loadAddProduct,
  addProduct,
  loadEditProduct,
  editProduct,
  changeProductStatus,
};
