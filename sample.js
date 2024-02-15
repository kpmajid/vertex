const mongoose = require("mongoose");
const OTP = require("./models/OTP");
mongoose.connect("mongodb://127.0.0.1:27017/VERTEX");
const db = mongoose.connection;

db.on("error", console.error.bind(console, "Connection error:"));
db.once("open", function () {
  console.log("Connected to MongoDB");

  sample();
});

async function sample() {
  try {
    const otps = await OTP.find({});
    console.log(otps);
    const getAdjustedDate = (minutes) => {
      const currentDate = new Date();
      currentDate.setMinutes(currentDate.getMinutes() - minutes);
      return currentDate.toISOString();
    };
    // Example: Decrease the current date by 5 minutes
    const adjustedDate = getAdjustedDate(5);
    console.log(adjustedDate);
    const timeLimit = await OTP.findOne({
      email: "kpmajid584@gmail.com",
    }).sort({ timeStamp: -1 });
    console.log(timeLimit);
    // console.log(nowDate());
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// Example usage

// Example usage

const sample1 = {
  productId: {
    category: {
      parentCategory: new ObjectId("65c06168461f2f2d811dd275"),
      subCategory: new ObjectId("65c068a8879c95a9341c3951"),
    },
    _id: new ObjectId("65c0708e898128f8367aef00"),
    name: "Cozy Fleece Mega Raglan Hoodie",
    price: 1250,
    variants: [[Object], [Object], [Object]],
    images: [
      "1707110542162.webp",
      "1707110542165.jpg",
      "1707110542167.webp",
      "1707290374836.webp",
    ],
    __v: 4,
  },
  color: "black",
  size: "small",
  quantity: 1,
  _id: new ObjectId("65c5773c44b32f7c4b3e89ab"),
};
