const Admin = require("../../models/Admin");
const bcrypt = require("bcrypt");

const loadLogin = (req, res) => {
  res.render("adminViews/login");
};

const authenticateAdmin = async (req, res) => {
  try {
    console.log("admin login");
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const admin = await Admin.findOne({ email: email });

    if (!admin) {
      return res.json({ message: "Invalid username or password" });
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);

    if (!passwordMatch) {
      return res.json({ message: "Invalid username or password" });
    }

    req.session.admin = admin._id;
    res.redirect("/admin/dashboard");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const registerAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const isExist = await Admin.findOne({ email: email });

    if (isExist) {
      return res.json({ success: false, message: "admin already exist." });
    }

    let hashedPassword = await bcrypt.hash(password, 10);

    const admin = new Admin({
      email,
      password: hashedPassword,
    });
    await admin.save();

    res.json({ success: true, message: "new admin created." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const logout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
    res.status(500).render("error", { error: error.message });
  }
};

module.exports = { loadLogin, authenticateAdmin, registerAdmin, logout };
