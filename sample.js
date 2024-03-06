const dayjs = require("dayjs");
const Orders = require("./models/Orders");

async function renderSalesChart() {
  try {
    console.log("rending sal");
    const period = "monthly";
    let i = 5;
    const result = [];
    const today = dayjs().format("YYYY-MM-DD").toString();
    while (i >= 0) {
      result[i] = {};
      if (period === "daily") {
        result[i].from = `${dayjs(today)
          .subtract(5 - i, "day")
          .format("YYYY-MM-DD")
          .toString()} 00:00:00`;
        result[i].to = `${dayjs(today)
          .subtract(5 - i, "day")
          .format("YYYY-MM-DD")
          .toString()} 23:59:59`;
      }
      if (period === "weekly") {
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
      if (period === "monthly") {
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
                $sum: "$total",
              },
            },
          },
        ]);
        return queryResult;
      })
    );
    console.log(results);
  } catch (error) {
    console.log(error);
  }
}
renderSalesChart();
