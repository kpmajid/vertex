const loadPassword = (req, res) => {
  res.render("usersViews/password");
};

const changePassword = async (req, res) => {
  try {
    console.log("changing password");
    const { password, newPassword } = req.body;
    const { id } = req.session.user;
    const user = await User.findById(id);
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "wrong password" });
    }
    console.log("Matching");
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.save();
    res.status(200).json({ message: "password changed" });
  } catch (error) {
    console.log(error);
  }
};

module.exports = { loadPassword, changePassword };
