const User = require("../../models/User");
const Wallet = require("../../models/Wallet");
const Coupons = require("../../models/Coupons");

const loadProfile = async (req, res) => {
  try {
    const { id } = req.session.user;
    const user = await User.findById(id);
    const currentDate = new Date();
    const coupons = await Coupons.find({
      start: { $lte: currentDate },
      end: { $gte: currentDate },
    });
    console.log(coupons);
    res.render("usersViews/profile", { user,coupons });
  } catch (error) {
    console.log(error);
  }
};

const editProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const { id } = req.session.user;
    const isExist = await User.findOne({ email: email, _id: { $ne: id } });
    if (isExist) {
      return res.status(406).json({ message: `${email} already taken` });
    }
    const user = await User.findById(id);
    user.name = name;
    user.email = email;
    user.save();

    res.status(200).json({ message: "profile updated successfully" });
  } catch (error) {
    console.log(error);
  }
};

const loadWallet = async (req, res) => {
  try {
    const { id } = req.session.user;
    const wallet = await Wallet.findOne({ user: id }).sort({
      "transactions.date": -1,
    });
    console.log(wallet);
    res.render("usersViews/wallet", { wallet });
  } catch (error) {
    console.log(error);
  }
};

module.exports = { loadProfile, editProfile, loadWallet };
