const Orders = require("../../models/Orders");
const Cart = require("../../models/Cart");
const Product = require("../../models/Product");
const Coupons = require("../../models/Coupons");
const Address = require("../../models/Address");

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
    let { addressId, paymentMethod } = req.body;
    const paymentStatus = paymentMethod === "paypal" ? "Paid" : "Pending";

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

    const latestOrder = await Orders.findOne().sort({ order_number: -1 });
    let order_number = latestOrder?.order_number ?? 10000;

    const coupon = req.session.coupon;
    let couponDoc;
    let Coupon = {};
    console.log(coupon);
    if (coupon.length > 0) {
      couponCode = couponCode.toUpperCase();
      couponDoc = await Coupons.findOne({ couponCode: couponCode });
      finalTotal -= couponDoc.discountAmount;
      Coupon.couponId = couponDoc._id;
      Coupon.discountAmount = couponDoc.discountAmount;
    }

    const order = new Orders({
      userId: id,
      products,
      shippingAddress,
      paymentMethod,
      paymentStatus,
      originalTotal,
      finalTotal,
      order_number: order_number + 1,
      coupon: Coupon,
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

    res.render("usersViews/singleOrder", {
      order,
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
    const { orderId, productId, reason } = req.body;

    const { id } = req.session.user;

    const orderDoc = await Orders.findOneAndUpdate(
      {
        _id: orderId,
        userId: id,
        products: {
          $elemMatch: {
            productId: productId,
          },
        },
      },
      {
        $set: {
          "products.$.cancel.status": "Canceled",
          "products.$.cancel.reason": reason,
          "products.$.cancel.date": Date.now(),
        },
      }
    );

    if (!orderDoc) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.status(200).json({ message: "Product canceled successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const returnProducts = async (req, res) => {
  try {
    
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const invoice = async (req, res) => {
  try {
    console.log("invoice");
    const invoice = {
      shipping: {
        name: "John Doe",
        address: "1234 Main Street",
        city: "San Francisco",
        state: "CA",
        country: "US",
        postal_code: 94111,
      },
      items: [
        {
          item: "TC 100",
          description: "Toner Cartridge",
          quantity: 2,
          amount: 6000,
        },
        {
          item: "USB_EXT",
          description: "USB Cable Extender",
          quantity: 1,
          amount: 2000,
        },
      ],
      subtotal: 8000,
      paid: 0,

      invoice_nr: 1234,
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

module.exports = {
  processCheckout,
  createOrder,
  LoadOrders,
  LoadSingleOrder,
  cancelOrder,
  cancelProducts,
  invoice,
};
