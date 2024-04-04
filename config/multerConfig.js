const path = require("path");
const fs = require("fs");

const multer = require("multer");

const uploadFolder = "../public/img/products/";
const absoluteUploadPath = path.join(__dirname, uploadFolder);

if (!fs.existsSync(absoluteUploadPath)) {
  fs.mkdirSync(absoluteUploadPath);
}

let productImageCounter = {};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log("Destination function called");
    cb(null, absoluteUploadPath);
  },
  filename: function (req, file, cb) {
    console.log("Filename function called");
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

module.exports = { upload };
