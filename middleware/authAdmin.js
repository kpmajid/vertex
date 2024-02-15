const isLogin = (req, res, next) => {
  try {
    if (!req.session.admin) {
      return res.redirect("/admin");
    }
    next();
  } catch (error) {
    console.log(error);
  }
};

const isLogout = (req, res, next) => {
  try {
    if (req.session.admin) {
      return res.redirect("/admin/dashboard");
    }
    next();
  } catch (error) {
    console.log(error);
  }
};

module.exports = { isLogin, isLogout };
