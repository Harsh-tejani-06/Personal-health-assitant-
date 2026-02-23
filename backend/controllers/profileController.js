import User from "../models/User.js";


// Get Profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      fullname: user.fullname,
      displayName: user.displayName,
      avatar: user.avatar,
      healthProfile: user.healthProfile
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Profile (Basic Info - Display Name)
export const updateProfile = async (req, res) => {
  try {
    const { fullname, displayName } = req.body;

    const updateData = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (fullname !== undefined) updateData.fullname = fullname;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    );
    res.json({
      fullname: user.fullname,
      displayName: user.displayName
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const saveHealthProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findByIdAndUpdate(
      userId,
      { healthProfile: req.body },
      { new: true }
    );

    res.json(user.healthProfile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const saveLLMAnswers = async (req, res) => {
  try {
    const userId = req.user._id;
    const { question, answer } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { llmAnswers: { question, answer } } },
      { new: true }
    );

    res.json(user.llmAnswers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const avatarPath = `/uploads/${req.file.filename}`;

    // Update user avatar in DB
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarPath },
      { new: true }
    );

    res.json({ avatar: user.avatar });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
