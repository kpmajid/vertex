const Coupons = require("../models/Coupons");

const renderCoupon = async (req, res) => {
  try {
    const coupons = await Coupons.find();
    res.render("adminViews/coupon", { coupons });
  } catch (error) {
    console.log(error);
  }
};

const renderAddCoupon = (req, res) => {
  try {
    res.render("adminViews/add-coupon");
  } catch (error) {
    console.log(error);
  }
};

const generateCoupon = async (req, res) => {
  try {
    let length = 8;
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"; // Characters to use in the coupon
    let coupon = "";

    let isUnique = false;
    while (!isUnique) {
      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        coupon += charset[randomIndex];
      }

      const existingCoupon = await Coupons.findOne({ code: coupon });
      if (!existingCoupon) {
        console.log("trie");
        isUnique = true;
      } else {
        coupon = ""; // Reset coupon if it's not unique
      }
    }
    console.log(coupon);
    res.status(200).json({ coupon });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const createCoupon = async (req, res) => {
  try {
    const { couponCode, discountAmount, minimumAmount, start, end } = req.body;

    const coupon = new Coupons({
      couponCode,
      discountAmount,
      minimumAmount,
      start,
      end,
    });
    await coupon.save();

    res.status(200).json({ message: "Coupon created successfully." });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  renderCoupon,
  renderAddCoupon,
  generateCoupon,
  createCoupon,
};
