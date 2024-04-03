const Orders = require("../../models/Orders");
const Cart = require("../../models/Cart");
const Product = require("../../models/Product");
const Coupons = require("../../models/Coupons");
const Address = require("../../models/Address");
const Wallet = require("../../models/Wallet");

const { createInvoice } = require("../../utils/createInvoice");

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
    let { addressId, paymentMethod, paymentStatus } = req.body;
    if (!paymentStatus) {
      paymentStatus = paymentMethod === "paypal" ? "Paid" : "Pending";
    }

    console.log(paymentStatus);
    // Retrieve cart details and populate products
    const cart = await Cart.findOne({ userId: id }).populate(
      "products.productId",
      "-category -description -variants -status -images"
    );

    const products = [];
    let originalTotal = 0;
    cart.products.forEach((cartItem) => {
      console.log("cartItem");
      console.log(cartItem);
      const {
        productId: { _id: productId, originalPrice, discountedPrice },
        color,
        size,
        quantity,
      } = cartItem;

      console.log("originalPrice, discountedPrice");
      console.log(originalPrice, discountedPrice);

      const price =
        discountedPrice !== undefined && discountedPrice !== null
          ? discountedPrice
          : originalPrice;

      console.log(price);

      originalTotal += quantity * price;

      products.push({
        productId,
        price,
        color,
        size,
        quantity,
      });
    });
    console.log("products array");
    console.log(products);

    let finalTotal = originalTotal;

    const latestOrder = await Orders.findOne().sort({ order_number: -1 });
    let order_number = latestOrder?.order_number ?? 10000;

    const { coupon } = req.session;
    let couponDoc;
    let couponDetails = {};
    console.log(coupon);

    if (coupon.length > 0) {
      couponCode = coupon.toUpperCase();
      couponDoc = await Coupons.findOne({ couponCode: couponCode });
      finalTotal -= couponDoc.discountAmount;
      couponDetails.code = couponCode;
      couponDetails.couponId = couponDoc._id;
      couponDetails.discountAmount = couponDoc.discountAmount;
    }

    if (paymentMethod == "COD" && finalTotal > 1000) {
      return res.status(400).json({
        message: "Purchase limit exceeded. Maximum purchase amount is 1000.",
      });
    }

    if (paymentMethod == "wallet") {
      const walletDoc = await Wallet.findOne({ user: id });
      if (finalTotal > walletDoc.currentBalance) {
        return res.status(400).json({
          message: "Insufficient wallet balance.",
        });
      }
      console.log(walletDoc);

      const orderTransaction = {
        description: "Placed new Order",
        type: "debit",
        amount: finalTotal,
      };

      walletDoc.transactions.push(orderTransaction);
      walletDoc.currentBalance -= finalTotal;

      await walletDoc.save();
      paymentStatus = "Paid";
    }

    console.log(addressId);
    addressId = new ObjectId(addressId);
    const addressDoc = await Address.findOne({
      userId: id,
      "addresses._id": addressId,
    });
    console.log(addressDoc);
    console.log(addressDoc.addresses[0]);

    let shippingAddress = {};
    shippingAddress.fullname = addressDoc.addresses[0].fullname;
    shippingAddress.mobile = addressDoc.addresses[0].mobile;
    shippingAddress.address = addressDoc.addresses[0].address;
    shippingAddress.pincode = addressDoc.addresses[0].pincode;
    shippingAddress.state = addressDoc.addresses[0].state;
    shippingAddress.city = addressDoc.addresses[0].city;
    shippingAddress.street = addressDoc.addresses[0].street;

    let orderData = {
      userId: id,
      products,
      shippingAddress,
      paymentMethod,
      paymentStatus,
      originalTotal,
      finalTotal,
      order_number: order_number + 1,
      coupon: couponDetails,
    };
    if (paymentMethod == "paypal" && req.body.payment_id) {
      orderData.paymentId = req.body.payment_id;
    }

    const order = new Orders(orderData);

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

    res
      .status(200)
      .json({ message: "order placed successfully", orderId: order._id });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const loadSuccessCheckout = async (req, res) => {
  try {
    const { id } = req.session.user;
    const orderId = req.params.id;
    console.log(orderId);

    const order = await Orders.findOne({ userId: id, _id: orderId })
      .populate("products.productId")
      .populate("userId");
    console.log(order);
    res.render("usersViews/checkoutSuccess", { order });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const LoadOrders = async (req, res) => {
  try {
    const { id } = req.session.user;
    const orders = await Orders.find({ userId: id }).sort({ createdAt: -1 });
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
    console.log(order);
    let totalAmount = 0;
    order.products.forEach((product) => {
      totalAmount += product.price * product.quantity;
    });
    if (order.coupon.code) {
      totalAmount -= order.coupon.discountAmount;
    }

    console.log(totalAmount);

    res.render("usersViews/singleOrder", {
      order,
      totalAmount,
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
    order.products.forEach((product) => {
      console.log(product);
    });
    console.log(order);

    // await order.save();
    res.status(200).json({ message: "order canceled successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const cancelProducts = async (req, res) => {
  try {
    const { orderId, itemId, productId, reason } = req.body;
    console.log(orderId, productId, reason);

    const { id } = req.session.user;

    console.log(id);

    const orderDoc = await Orders.findOneAndUpdate(
      {
        _id: orderId,
        userId: id,
        "products._id": itemId,
      },
      {
        $set: {
          "products.$.cancel.status": "Canceled",
          "products.$.cancel.reason": reason,
          "products.$.cancel.date": Date.now(),
        },
      },
      { new: true }
    );

    if (!orderDoc) {
      return res.status(404).json({ error: "Order not found" });
    }

    const itemDetails = orderDoc.products.find((item) => {
      return item._id.equals(itemId);
    });

    console.log(itemDetails);

    //update product quantity
    const product = await Product.findOneAndUpdate(
      {
        _id: itemDetails.productId,
        "variants.color": itemDetails.color,
        "variants.size": itemDetails.size,
      },
      {
        $inc: {
          "variants.$.quantity": itemDetails.quantity,
        },
      },
      { new: true }
    );

    let finalTotal = orderDoc.finalTotal;

    //refund
    console.log("refund");
    let refund = itemDetails.quantity * itemDetails.price;
    if (refund > orderDoc.finalTotal) {
      refund = orderDoc.finalTotal;
    }

    if (orderDoc.coupon.code) {
      const coupon = await Coupons.findById(orderDoc.coupon.couponId);
      if (finalTotal < coupon.minimumAmount) {
        refund -= orderDoc.coupon.discountAmount;
      }
    }
    finalTotal -= refund;

    if (orderDoc.paymentStatus == "Paid") {
      const walletDoc = await Wallet.findOne({ user: id });

      const refundTransaction = {
        description: `Cancelled Product, Order:${orderDoc.order_number}`,
        type: "credit",
        amount: refund,
      };

      walletDoc.transactions.push(refundTransaction);
      walletDoc.currentBalance += refund;
      await walletDoc.save();
    }

    let allCancelled = true;
    console.log("orderDoc");
    console.log(orderDoc);
    console.log("allCancelled");
    for (const product of orderDoc.products) {
      console.log(product);
      let isCancelled = product.cancel?.status || null;
      console.log(isCancelled);
      if (!isCancelled) {
        console.log(isCancelled);
        allCancelled = false;
        break;
      }
    }

    let orderStatus = orderDoc.orderStatus;
    let paymentStatus = orderDoc.paymentStatus;

    if (allCancelled && orderDoc.orderStatus !== "Delivered") {
      orderStatus = "Cancelled";
      paymentStatus = "Refunded";
    }

    console.log("orderStatus, paymentStatus, finalTotal");
    console.log(orderStatus, paymentStatus, finalTotal);
    await Orders.findOneAndUpdate(
      { _id: orderId },
      {
        $set: {
          orderStatus: orderStatus,
          paymentStatus: paymentStatus,
          finalTotal: finalTotal,
        },
      }
    );

    res.status(200).json({ message: "Product canceled successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const returnProducts = async (req, res) => {
  try {
    console.log("return rprodcut");
    const { orderId, productId, itemId, reason } = req.body;
    console.log(orderId, productId, reason);

    const { id } = req.session.user;
    console.log(id);

    const orderDoc = await Orders.findOneAndUpdate(
      {
        _id: orderId,
        userId: id,
        "products._id": itemId,
      },
      {
        $set: {
          "products.$.cancel.status": "Returned",
          "products.$.cancel.reason": reason,
          "products.$.cancel.date": Date.now(),
        },
      },
      { new: true }
    );

    if (!orderDoc) {
      return res.status(404).json({ error: "Order not found" });
    }

    console.log("orderDoc");
    console.log(orderDoc);

    const itemDetails = orderDoc.products.find((item) => {
      return item._id.equals(itemId);
    });

    console.log(itemDetails);

    const product = await Product.findOneAndUpdate(
      {
        _id: itemDetails.productId,
        "variants.color": itemDetails.color,
        "variants.size": itemDetails.size,
      },
      {
        $inc: {
          "variants.$.quantity": itemDetails.quantity,
        },
      },
      { new: true }
    );

    let finalTotal = orderDoc.finalTotal;
    //refund
    let refund = itemDetails.quantity * itemDetails.price;
    if (refund > orderDoc.finalTotal) {
      refund = orderDoc.finalTotal;
    }
    finalTotal -= refund;

    const walletDoc = await Wallet.findOne({ user: id });

    const refundTransaction = {
      description: `Returned Product, Order:${orderDoc.order_number}`,
      type: "credit",
      amount: refund,
    };

    walletDoc.transactions.push(refundTransaction);
    walletDoc.currentBalance += refund;
    await walletDoc.save();

    let allReturned = true;
    for (const product of orderDoc.products) {
      console.log(product);
      let allReturned =
        product.cancel?.status || product.return?.status || null;
      console.log(allReturned);
      if (!allReturned) {
        console.log(allReturned);
        allReturned = false;
        break;
      }
    }

    let orderStatus = orderDoc.orderStatus;
    let paymentStatus = orderDoc.paymentStatus;

    if (allReturned && orderDoc.orderStatus == "Delivered") {
      orderStatus = "Returned";
      paymentStatus = "Refunded";
    }

    console.log("orderStatus, paymentStatus, finalTotal");
    console.log(orderStatus, paymentStatus, finalTotal);

    await Orders.findOneAndUpdate(
      { _id: orderId },
      {
        $set: {
          orderStatus: orderStatus,
          paymentStatus: paymentStatus,
          finalTotal: finalTotal,
        },
      }
    );

    res.status(200).json({ message: "Product retuned successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const invoice = async (req, res) => {
  try {
    console.log("invoice");
    const { id } = req.params;
    console.log(id);

    const orderDoc = await Orders.findById(id);
    console.log("x");
    console.log(orderDoc);
    let items = [];
    orderDoc.products.forEach((item) => {});
    let subtotal;
    let paid = 0;
    if (orderDoc.paymentStatus == "Paid") {
      paid = orderDoc.finalTotal * 100;
    }

    const invoice = {
      shipping: {
        name: orderDoc.shippingAddress.fullname,
        address: orderDoc.shippingAddress.address,
        city: orderDoc.shippingAddress.city,
        state: orderDoc.shippingAddress.state,
        country: "India",
        postal_code: orderDoc.shippingAddress.pincode,
      },
      items: items,
      subtotal: orderDoc.originalTotal * 100,
      paid,
      coupon: {
        code: orderDoc?.coupon?.code || "none",
        value: orderDoc?.coupon?.discountAmount * 100 || 0,
      },
      Order_nr: orderDoc.order_number,
    };

    const generatedPDF = createInvoice(invoice);
    console.log("pdf generated");

    // Set the appropriate headers for PDF response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="example.pdf"');

    // Send the generated PDF buffer as a response
    generatedPDF.pipe(res);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const pay = async (req, res) => {
  try {
    const { id, paymentId } = req.body;
    const order = await Orders.findById(id);
    order.paymentStatus = "Paid";
    order.paymentId = paymentId;

    await order.save();

    res.status(200).json({ message: "Payment Successfull" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  processCheckout,
  createOrder,
  loadSuccessCheckout,
  LoadOrders,
  LoadSingleOrder,
  cancelOrder,
  cancelProducts,
  returnProducts,
  invoice,
  pay,
};
