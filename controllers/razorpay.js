const Razorpay = require("razorpay");
const crypto = require("crypto");

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const razorPayOrder = async (req, res) => {
  try {
    console.log("razor");
    console.log(typeof req.body.amount);
    let { amount } = req.body;
    amount = parseInt(amount);
    console.log(typeof amount);
    const options = {
      amount: amount * 100,
      currency: "INR",
    };
    const order = await instance.orders.create(options);
    res.status(200).json({ orderId: order.id });
  } catch (error) {
    console.log(error);
  }
};

const verifyPayment = (req, res) => {
  console.log("verifyPayment");
  console.log(req.body);

  const { payment_id, order_id, signature } = req.body;

  const data = `${order_id}|${payment_id}`;

  const generated_signature = crypto
    .createHmac("sha256", "IFfmtKIgHPG3MPVxoTeBwEbb")
    .update(data)
    .digest("hex");

  console.log(generated_signature);
  console.log(signature);

  if (generated_signature !== signature) {
    console.log("true?");
    res
      .status(400)
      .json({
        success: false,
        message: "Payment signature verification failed",
      });
    return;
  }



  res.status(200).json({ message: "payment successful", });
};

module.exports = { razorPayOrder, verifyPayment };
