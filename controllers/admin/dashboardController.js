const Product = require("../../models/Product");
const User = require("../../models/User");
const Orders = require("../../models/Orders");

const dayjs = require("dayjs");

const { ObjectId } = require("mongodb");

const mongoose = require("mongoose");

const bcrypt = require("bcrypt");

async function top10Products() {
  try {
    const products = await Orders.aggregate([
      {
        $match: {
          orderStatus: "Delivered",
        },
      },
      { $unwind: "$products" },
      {
        $match: {
          $or: [
            { "products.status": { $exists: false } },
            { "products.return": { $exists: false } },
          ],
        },
      },
      {
        $group: {
          _id: "$products.productId",
          totalQuantity: {
            $sum: "$products.quantity",
          },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "Product",
        },
      },
      { $sort: { totalQuantity: -1 } },
    ]);
    return products;
  } catch (error) {
    console.log(error);
  }
}

async function top10Category() {
  try {
    const products = await Orders.aggregate([
      {
        $match: {
          orderStatus: "Delivered",
        },
      },
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "Product",
        },
      },
      { $unwind: "$Product" },
      {
        $lookup: {
          from: "categories",
          localField: "Product.category.parentCategory",
          foreignField: "_id",
          as: "parentCategory",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "Product.category.subCategory",
          foreignField: "_id",
          as: "subCategory",
        },
      },
      { $unwind: "$parentCategory" },
      { $unwind: "$subCategory" },
      {
        $addFields: {
          category: {
            $concat: ["$parentCategory.name", " - ", "$subCategory.name"],
          },
        },
      },
      {
        $group: {
          _id: "$category",
          totalQuantity: {
            $sum: "$products.quantity",
          },
        },
      },
      { $sort: { totalQuantity: -1 } },
    ]);
    return products;
  } catch (error) {
    console.log(error);
  }
}

const loadDashboard = async (req, res) => {
  try {
    let userCount = await User.aggregate([
      {
        $group: {
          _id: "",
          totalUsers: { $sum: 1 },
        },
      },
    ]);
    console.log(userCount);

    userCount = userCount[0].totalUsers;

    let total = await Orders.aggregate([
      {
        $group: {
          _id: "",
          totalOrders: { $sum: 1 },
          totalAmount: {
            $sum: "$finalTotal",
          },
        },
      },
    ]);

    total = total[0];

    console.log(total);

    const result = await Orders.aggregate([
      [
        {
          $group: {
            _id: "$paymentMethod",
            totalOrders: { $sum: 1 },
          },
        },
      ],
    ]);
    console.log(result);

    let top10ProductsList = await top10Products();
    let top10CategoryList = await top10Category();
    res.render("adminViews/dashboard", {
      userCount,
      total,
      result,
      top10ProductsList,
      top10CategoryList,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const renderSalesChart = async (req, res) => {
  try {
    const { period = "Weekly" } = req.params;
    console.log(req.params);
    console.log(period);
    let i = 5;
    const result = [];
    const today = dayjs().format("YYYY-MM-DD").toString();
    while (i >= 0) {
      result[i] = {};
      if (period === "Daily") {
        result[i].from = `${dayjs(today)
          .subtract(5 - i, "day")
          .format("YYYY-MM-DD")
          .toString()} 00:00:00`;
        result[i].to = `${dayjs(today)
          .subtract(5 - i, "day")
          .format("YYYY-MM-DD")
          .toString()} 23:59:59`;
      }
      if (period === "Weekly") {
        result[i].from = `${dayjs(today)
          .subtract(5 - i, "week")
          .startOf("week")
          .format("YYYY-MM-DD")
          .toString()} 00:00:00`;
        result[i].to = `${dayjs(today)
          .subtract(5 - i, "week")
          .endOf("week")
          .format("YYYY-MM-DD")
          .toString()} 23:59:59`;
      }
      if (period === "Monthly") {
        result[i].from = `${dayjs(today)
          .subtract(5 - i, "month")
          .startOf("month")
          .format("YYYY-MM-DD")
          .toString()} 00:00:00`;
        result[i].to = `${dayjs(today)
          .subtract(5 - i, "month")
          .endOf("month")
          .format("YYYY-MM-DD")
          .toString()} 23:59:59`;
      }
      i -= 1;
    }

    console.log(result);

    const results = await Promise.all(
      result.map(async (element) => {
        const queryResult = await Orders.aggregate([
          {
            $match: {
              createdAt: {
                $gte: new Date(element.from),
                $lte: new Date(element.to),
              },
            },
          },
          {
            $group: {
              _id: null,
              orders: {
                $sum: 1,
              },
              sales: {
                $sum: "$finalTotal",
              },
            },
          },
        ]);

        console.log("queryResult", queryResult);
        return {
          sales: queryResult[0]?.sales || 0,
          orders: queryResult[0]?.orders || 0,
          time: dayjs(element.to).format("MMM DD").toString(),
        };
      })
    );
    console.log(results);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const renderPieChart = async (req, res) => {
  try {
    const result = await Orders.aggregate([
      [
        {
          $group: {
            _id: "$paymentMethod",
            totalOrders: { $sum: 1 },
          },
        },
      ],
    ]);
    console.log(result);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const loadSales = async (req, res) => {
  res.render("adminViews/sales");
};

const generateSales = async (req, res) => {
  try {
    let { start, end } = req.query;
    console.log("start end");

    start = `${dayjs(start).format("YYYY-MM-DD").toString()} 00:00:00`;
    end = `${dayjs(end).format("YYYY-MM-DD").toString()} 23:59:59`;

    const report = await Orders.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(start),
            $lte: new Date(end),
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $project: {
          order_number: 1,
          paymentStatus: 1,
          orderStatus: 1,
          user: {
            $arrayElemAt: ["$user.name", 0],
          },
          finalTotal: 1,
          createdAt: 1,
          _id: 0,
        },
      },
    ]);
    console.log(report);
    res.status(200).json({ report });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  loadDashboard,
  renderSalesChart,
  renderPieChart,
  loadSales,
  generateSales,
};
