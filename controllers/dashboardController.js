const Product = require("../models/Product");
const User = require("../models/User");
const Orders = require("../models/Orders");

const dayjs = require("dayjs");

const { ObjectId } = require("mongodb");

const mongoose = require("mongoose");

const bcrypt = require("bcrypt");

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
    res.render("adminViews/dashboard", { userCount, total, result });
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

module.exports = {
  loadDashboard,
  renderSalesChart,
  renderPieChart,
};
