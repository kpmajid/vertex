const Address = require("../models/Address");

const loadAddress = async (req, res) => {
  try {
    const { id } = req.session.user;
    const addressesDoc = await Address.findOne({ userId: id });

    const addresses = addressesDoc?.addresses ?? null;

    res.render("usersViews/address", { addresses });
  } catch (error) {
    console.log(error);
  }
};

const removeAddress = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: "User not authenticated." });
    }
    const { id } = req.session.user;

    const { addressId } = req.body;
    if (!addressId) {
      return res
        .status(400)
        .json({ error: "addressId is missing in the request." });
    }
    const address = await Address.updateOne(
      { userId: id },
      { $pull: { addresses: { _id: addressId } } }
    );

    if (address.nModified === 0) {
      return res.status(404).json({ error: "Address not found." });
    }

    // Successful response
    return res.json({ success: true });
  } catch (error) {
    console.log(error);
  }
};

const loadAddAddress = (req, res) => {
  res.render("usersViews/add-address");
};

const addAddress = async (req, res) => {
  try {
    console.log("Add Address ");
    console.log(req.body);
    const { full_name, mobile, address, pincode, state, town_city, street } =
      req.body;
    const { id } = req.session.user;

    const addressDoc = await Address.findOne({ userId: id });

    addressDoc.addresses.push({
      fullname: full_name,
      mobile,
      address,
      pincode,
      state,
      city: town_city,
      street,
    });
    await addressDoc.save();

    res.status(200).json({ message: "address added" });
  } catch (error) {
    console.log(error);
  }
};

const loadEditAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    const { id } = req.session.user;
    const addressDoc = await Address.findOne(
      {
        userId: id,
        "addresses._id": addressId,
      },
      { "addresses.$": 1 }
    );
    const address = addressDoc.addresses[0];

    res.render("usersViews/edit-address", { address });
  } catch (error) {
    console.log(error);
  }
};

const editAddress = async (req, res) => {
  try {
    const { id } = req.session.user;
    const addressId = req.params.id;
    console.log(addressId);
    const { full_name, mobile, address, pincode, state, town_city, street } =
      req.body;

    const addressDoc = await Address.updateOne(
      {
        userId: id,
        "addresses._id": addressId,
      },
      {
        $set: {
          "addresses.$.fullname": full_name,
          "addresses.$.mobile": mobile,
          "addresses.$.address": address,
          "addresses.$.pincode": pincode,
          "addresses.$.state": state,
          "addresses.$.city": town_city,
          "addresses.$.street": street,
        },
      }
    );

    if (addressDoc.nModified === 0) {
      return res.status(404).json({ error: "Address not found." });
    }
    // Successful response
    return res.json({ success: true });
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  loadAddress,
  removeAddress,
  loadAddAddress,
  addAddress,
  loadEditAddress,
  editAddress,
};
