const isLogin = (req, res, next) => {
  try {
    if (!req.session.user) {
      return res.redirect("/login");
    }
    next();
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const isLogout = (req, res, next) => {
  try {
    if (req.session.user) {
      return res.redirect("/");
    }
    next();
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = { isLogin, isLogout };
