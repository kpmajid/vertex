const renderAttributes = async (req, res) => {
  try {
    res.render("adminViews/attributes");
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const renderAddAttributes = async (req, res) => {
  try {
    res.send("render Add Attributes");
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  renderAttributes,
  renderAddAttributes,
};
