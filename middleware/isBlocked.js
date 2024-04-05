const User = require("../models/User");

const isBlocked = async (req, res, next) => {
  try {
    if (!req.session.user) {
      res.redirect("/login");
      return;
    }
    const { id } = req.session.user;
    const user = await User.findById(id);
    console.log("isBlocked function");
    console.log(user);

    if (!user.isBlocked) {
      next();
      return;
    }
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return next(err);
      }
      console.log("Session destroyed.");
      res.redirect("/login");
    });
  } catch (error) {
    console.error("Error in isBlocked middleware:", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = { isBlocked };
