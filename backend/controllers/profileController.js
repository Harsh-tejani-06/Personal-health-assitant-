import User from "../models/User.js";

// Save or Update Profile
export const saveProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findByIdAndUpdate(
      userId,
      { profile: req.body },
      { new: true }
    );

    res.json(user.profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user.profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
