const Orders = require("../models/Orders");
const Cart = require("../models/Cart");

const createOrder = async (req, res) => {
  try {
    console.log("createOrder");
    console.log(req.body);
    const { id } = req.session.user;
    const { addressId, paymentMethod } = req.body;
    const paymentStatus = paymentMethod === "paypal" ? "Paid" : "Pending";

    const cart = await Cart.findOne({ userId: id }).populate(
      "products.productId",
      "-category -description -variants -status -images"
    );

    const products = [];
    let total = 0;
    cart.products.forEach((cartItem) => {
      console.log(cartItem);
      const {
        productId: { _id: productId, originalPrice, discountedPrice },
        color,
        size,
        quantity,
      } = cartItem;
      const price =
        discountedPrice !== undefined ? discountedPrice : originalPrice;
      total += quantity * price;

      products.push({
        productId,
        price,
        color,
        size,
        quantity,
      });
    });

    const latestOrder = await Orders.findOne().sort({ order_number: -1 });
    let order_number = latestOrder?.order_number ?? 10000;
    const order = new Orders({
      userId: id,
      products,
      shippingAddress: addressId,
      paymentMethod,
      paymentStatus,
      total,
      order_number: order_number + 1,
    });

    await order.save();

    cart.products = [];
    await cart.save();

    //decrease the quantity form the products
    for (const product of products) {
      const productDoc = await Product.findById(product.productId);

      const variantToUpdate = productDoc.variants.find(
        (v) => v.color === product.color && v.size === product.size
      );

      if (variantToUpdate) {
        variantToUpdate.quantity -= product.quantity;
        await productDoc.save();
      }
    }

    res.status(200).json({ message: "order placed successfully" });
  } catch (error) {
    console.log(error);
  }
};

const LoadOrders = async (req, res) => {
  try {
    const { id } = req.session.user;
    const orders = await Orders.find({ userId: id });
    res.render("usersViews/orders", { orders });
  } catch (error) {
    console.log(error);
  }
};

const LoadSingleOrder = async (req, res) => {
  try {
    const { id } = req.session.user;
    const orderId = req.params.orderId;
    console.log(orderId);

    const order = await Orders.findOne({ userId: id, _id: orderId }).populate(
      "products.productId"
    );

    console.log("order");
    console.log(order);

    const {
      shippingAddress,
      products,
      paymentMethod,
      paymentStatus,
      orderStatus,
      total,
      createdAt,
      _id,
    } = order;

    const addressDoc = await Address.findOne({ userId: id });

    const address = addressDoc.addresses.find((address) =>
      address._id.equals(shippingAddress)
    );

    res.render("usersViews/singleOrder", {
      address,
      products,
      paymentMethod,
      paymentStatus,
      orderStatus,
      total,
      createdAt,
      _id,
    });
  } catch (error) {
    console.log(error);
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { id } = req.session.user;
    const { orderId } = req.body;
    const order = await Orders.findOne({ userId: id, _id: orderId });
    order.orderStatus = "Cancelled";
    if (order.paymentStatus == "paid") {
      //return payment,
    }
    console.log(order);
    await order.save();
    res.status(200).json({ message: "order canceled successfully" });
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  createOrder,
  LoadOrders,
  LoadSingleOrder,
  cancelOrder,
};
