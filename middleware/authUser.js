const isLogin = (req, res, next) => {
  try {
    if (!req.session.user) {
      return res.redirect("/login");
    }
    next();
  } catch (error) {
    console.log(error);
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
  }
};

module.exports = { isLogin, isLogout };
