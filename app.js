require("dotenv").config();
const express = require("express");
const path = require("path");
const nocache = require("nocache");
const session = require("express-session");
const mongoose = require("mongoose");

const adminRouter = require("./routes/adminRoutes");
const usersRouter = require("./routes/usersRoutes");
const apiAdminRoutes = require("./routes/apiAdminRoutes");

mongoose.connect(process.env.DB);

const app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(nocache());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render("error", { error: err.message });
});

app.use("/admin", adminRouter);
app.use("/api/admin", apiAdminRoutes);
app.use("/", usersRouter);

app.get("*", function (req, res) {
  res.status(404).render("404");
});

app.listen(5000, () => {
  console.log("server is running");
});
