const User = require("../../models/User");
const Orders = require("../../models/Orders");

const loadUsers = async (req, res) => {
  try {
    let filter = {};

    if (req.query.status) {
      filter.isBlocked = req.query.status;
    }
    console.log(filter);
    const users = await User.find(filter).select({ password: 0 });

    users.forEach((user) => {
      user.formattedCreatedAt = user.createdAt.toLocaleDateString("en-GB");
    });

    const status = filter.isBlocked;
    res.render("adminViews/users", { users, status });
  } catch (error) {
    console.log(error);
  }
};

const loadSingleUser = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id);
    user.formattedCreatedAt = user.createdAt.toLocaleDateString("en-GB");
    const userId = user._id.toString();
    console.log(userId);
    const orders = await Orders.find({ userId: userId });
    console.log(orders);
    res.render("adminViews/singleUser", { user, orders });
  } catch (error) {
    console.log(error);
  }
};

const changeUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ success: false, message: "User not found." });
    }

    const newStatus = !user.isBlocked;
    console.log(user.isBlocked, newStatus);
    await User.findByIdAndUpdate(userId, {
      $set: { isBlocked: newStatus },
    });

    res.json({ success: true, message: "User status updated." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { loadUsers, loadSingleUser, changeUserStatus };
