const User = require("../models/User");

const isBlocked = async (req, res, next) => {
  try {
    if (req.session.user) {
      const { id } = req.session.user;
      const user = await User.findById(id);
      console.log("isBlocked fnc");
      console.log(user);
      if (!user.isBlocked) {
        next();
        return;
      }
    }
    req.session.destroy();
    res.redirect("/login");
    return;
  } catch (error) {
    console.log(error);
  }
};

module.exports = { isBlocked };
