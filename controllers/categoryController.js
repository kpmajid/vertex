const Category = require("../models/Category");

const addCategory = async (req, res) => {
  const { name, parentId } = req.body;
  console.log(req.body);
  try {
    if (name.length <= 0) {
      return res.status(400).json({ error: "name can't be empty" });
    }
    let query = {
      name: { $regex: `^${name}$`, $options: "i" },
      isParentCategory: true,
    };

    if (parentId) {
      // If parentId is provided, it's a subcategory
      const parentCategory = await Category.findById(parentId);

      if (!parentCategory) {
        return res
          .status(404)
          .json({ success: false, message: "Parent category not found" });
      }

      // For subcategories, check uniqueness within the parent's subcategories
      query = {
        name: { $regex: `^${name}$`, $options: "i" },
        isParentCategory: false,
        parentCategory: parentId,
      };
    }

    const existingCategory = await Category.findOne(query);

    if (existingCategory) {
      console.log(existingCategory);
      return res.status(404).json({
        success: false,
        message: "Category with the same name already exists",
      });
    }

    if (parentId) {
      const newSubcategory = new Category({
        name,
        isParentCategory: false,
        parentCategory: parentId,
      });
      await newSubcategory.save();
      const parentCategory = await Category.findById(parentId);
      parentCategory.subcategories.push(newSubcategory._id);
      await parentCategory.save();
    } else {
      const newCategory = new Category({ name });
      await newCategory.save();
    }

    res.status(200).json({ success: true, message: "Category Added" });
  } catch (error) {
    console.error("Error creating category or subcategory:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const editCategory = async (req, res) => {
  try {
    console.log("editCategory");
    const id = req.params.id;
    const newName = req.body.name;
    const category = await Category.findById(id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found." });
    }
    const isExisting = await Category.findOne({
      name: { $regex: `^${newName}$`, $options: "i" },
      _id: { $ne: id },
    });
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
  addCategory,
  editCategory,
  changeCategoryStatus,
};
