const Coupons = require("../../models/Coupons");

const checkCoupon = async (req, res) => {
  try {
    console.log("checkCoupon");
    let { couponCode } = req.params;
    const { totalAmount } = req.body;

    couponCode = couponCode.toUpperCase();

    console.log("couponCode,totalAmount");
    console.log(couponCode, totalAmount);

    if (!couponCode || !totalAmount || isNaN(totalAmount)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid input data" });
    }

    const couponDoc = await Coupons.findOne({ couponCode: couponCode });

    if (!couponDoc) {
      return res
        .status(404)
        .json({ success: false, error: "Invalid Coupon Code" });
    }

    const currentDate = new Date();

    if (currentDate < couponDoc.start || currentDate > couponDoc.end) {
      return res
        .status(404)
        .json({ success: false, error: "Coupon is expired" });
    }

    if (totalAmount < couponDoc.minimumAmount) {
      return res
        .status(400)
        .json({ success: false, error: "Minimum purchase amount is not met" });
    }

    res
      .status(200)
      .json({ success: true, discountAmount: couponDoc.discountAmount });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { checkCoupon };
