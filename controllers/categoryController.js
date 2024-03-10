const Category = require("../models/Category");

const { ObjectId } = require("mongodb");

const loadCategory = async (req, res) => {
  try {
    const categories = await Category.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "parentCategory",
          foreignField: "_id",
          as: "parent",
        },
      },
      {
        $addFields: {
          parentName: { $arrayElemAt: ["$parent.name", 0] },
        },
      },
      {
        $lookup: {
          from: "discounts",
          localField: "discount",
          foreignField: "_id",
          as: "discount",
        },
      },
      {
        $unwind: {
          path: "$discount",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          display_name: {
            $cond: {
              if: "$parentName",
              then: { $concat: ["$parentName", " / ", "$name"] },
              else: "$name",
            },
          },
          name: 1,
          status: 1,
          isParentCategory: 1,
          parentCategory: 1,
          subcategories: 1,
          discount: 1,
        },
      },
      {
        $sort: {
          display_name: 1,
        },
      },
    ]);

    // console.log("categories");
    // console.log(categories);

    res.render("adminViews/category", { categories });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
    // res.send(error);
  }
};

const loadAddCategory = async (req, res) => {
  try {
    const categories = await Category.find({ isParentCategory: true });
    res.render("adminViews/add-category", { categories });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addCategory = async (req, res) => {
  try {
    const { name, category } = req.body;
    console.log("name, category");

    let query = {
      name: { $regex: `^${name}$`, $options: "i" },
      isParentCategory: true,
    };

    if (category) {
      const parentCategory = await Category.findById(category);

      if (!parentCategory) {
        return res
          .status(400)
          .json({ success: false, message: "Parent category not found" });
      }

      // For subcategories, check uniqueness within the parent's subcategories
      query = {
        name: { $regex: `^${name}$`, $options: "i" },
        isParentCategory: false,
        parentCategory: category,
      };
    }

    const existingCategory = await Category.findOne(query);

    if (existingCategory) {
      console.log(existingCategory);
      return res.status(409).json({
        success: false,
        message: "Category with the same name already exists",
      });
    }

    if (category) {
      const newSubcategory = new Category({
        name,
        isParentCategory: false,
        parentCategory: category,
      });
      await newSubcategory.save();
      const parentCategory = await Category.findById(category);
      parentCategory.subcategories.push(newSubcategory._id);
      await parentCategory.save();
    } else {
      const newCategory = new Category({ name });
      await newCategory.save();
    }

    res.status(200).json({ success: true, message: "Category Added" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const loadEditCategory = async (req, res) => {
  try {
    const id = req.params.id;
    console.log(id);
    let category = await Category.aggregate([
      {
        $match: {
          _id: new ObjectId(id),
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "parentCategory",
          foreignField: "_id",
          as: "parentCategory",
        },
      },
      {
        $unwind: {
          path: "$parentCategory",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);
    const categories = await Category.find(
      {
        isParentCategory: true,
        _id: { $ne: id },
      },
      { name: 1 }
    );

    category = category[0];
    console.log("category, ");
    console.log(category);
    console.log(categories);
    // res.status(200).json({ category, categories });
    res.render("adminViews/edit-category", { category, categories });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const editCategory = async (req, res) => {
  try {
    console.log("editCategory");
    const id = req.params.id;
    const newName = req.body.name;
    const category = await Category.findById(id);
    console.log(category);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found." });
    }
    const isExisting = await Category.findOne({
      name: { $regex: `^${newName}$`, $options: "i" },
      _id: { $ne: id },
    });
    console.log(isExisting);
    if (isExisting) {
      return res
        .status(400)
        .json({ success: false, message: "Category already exists." });
    }

    category.name = newName;
    await category.save();

    res.json({ success: true, message: "Category Updated" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const changeCategoryStatus = async (req, res) => {
  try {
    const categoryId = req.params.id;

    const category = await Category.findById(categoryId);

    if (!category) {
      res.status(404).json({ success: false, message: "Category not found." });
    }

    const newStatus = category.status === "listed" ? "unlisted" : "listed";

    await Category.findByIdAndUpdate(categoryId, {
      $set: { status: newStatus },
    });

    res.json({ success: true, message: "Category status updated." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  loadCategory,
  loadAddCategory,
  addCategory,
  loadEditCategory,
  editCategory,
  changeCategoryStatus,
};
