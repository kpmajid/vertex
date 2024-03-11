const Orders = require("../models/Orders");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Coupons = require("../models/Coupons");

const { ObjectId } = require("mongodb");

const processCheckout = async (req, res) => {
  try {
    const { id } = req.session.user;

    const cart = await Cart.findOne({ userId: id });

    console.log(cart);
    const items = cart.products;
    for (const item of items) {
      const product = await Product.aggregate([
        [
          { $unwind: "$variants" },
          {
            $match: {
              _id: new ObjectId(item.productId),
              "variants.color": item.color,
              "variants.size": item.size,
            },
          },
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
            $unwind: "$parentCategory",
          },
          {
            $unwind: "$subCategory",
          },
        ],
      ]);
      console.log("product in processCheckout");
      console.log(product);

      if (product.length > 0) {
        if (
          product[0].parentCategory.status != "listed" ||
          product[0].subCategory.status != "listed" ||
          product[0].status != "listed"
        ) {
          return res.status(404).json({
            success: false,
            error:
              "Please remove unavilable and out of stock products from cart.",
          });
        }
        const availableQuantity = product[0].variants.quantity;

        if (item.quantity > availableQuantity) {
          return res.status(400).json({
            error: `Not enough quantity available for ${product[0].name}`,
          });
        }
      } else {
        return res.status(400).json({ error: "Product not found" });
      }
    }

    const { coupon, totalAmount } = req.body;

    if (coupon.length > 0) {
      console.log(coupon);
      couponCode = coupon.toUpperCase();

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
        return res.status(400).json({
          success: false,
          error: "Minimum purchase amount is not met",
        });
      }
    }

    req.session.coupon = coupon;

    return res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

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
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const LoadOrders = async (req, res) => {
  try {
    const { id } = req.session.user;
    const orders = await Orders.find({ userId: id });
    res.render("usersViews/orders", { orders });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
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
    res.status(500).json({ error: "Internal Server Error" });
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
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  processCheckout,
  createOrder,
  LoadOrders,
  LoadSingleOrder,
  cancelOrder,
};
