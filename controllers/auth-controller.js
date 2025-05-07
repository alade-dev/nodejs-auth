const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

//register controller
const registerUser = async (req, res) => {
  try {
    //extract all the information from the request body
    const { username, email, password, role } = req.body;
    //check if the user already existed
    // const checkExistingUser = await User.findOne({$or: [{email},{username}]})
    // if(checkExistingUser){
    //     return res.status(400).json({
    //         success: false,
    //         message: "User already exists with either the same username or same email. Please try again with different username or email address"
    //     })
    // }
    const checkExistingUserWithEmail = await User.findOne({ email });
    if (checkExistingUserWithEmail) {
      return res.status(400).json({
        success: false,
        message:
          "User already exists with the same email. Please try again with different email address",
      });
    }
    const checkExistingUserWithUsername = await User.findOne({ username });
    if (checkExistingUserWithUsername) {
      return res.status(400).json({
        success: false,
        message:
          "User already exists with the same username. Please try again with different username",
      });
    }

    //hash user password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newlyRegisterUser = new User({
      username,
      email,
      password: hashedPassword,
      role: role || "user",
    });

    await newlyRegisterUser.save();

    if (newlyRegisterUser) {
      res.status(201).json({
        success: true,
        message: "User registered successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Unable to register the user, Please try again! ",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Something occurred! Please try again",
    });
  }
};

//login controller
const loginUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    //check if the username or email exists in our database

    const user = await User.findOne({ $or: [{ email }, { username }] });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User doesn't exists",
      });
    }

    //compare and check password correct or not
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials!",
      });
    }

    //create access token
    const accessToken = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "30m" }
    );

    res.status(200).json({
      success: true,
      message: "Logged In successful",
      accessToken,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Something occurred! Please try again",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.userInfo.userId;

    //extract the old and new password from the req body
    const { oldPassword, newPassword } = req.body;

    //find the current logged in user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    //check if the old password is correct
    const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({
        success: false,
        message: "Old password is not correct, please try again",
      });
    }

    //hash the new password
    const salt = await bcrypt.genSalt(12);
    const newHashedPassword = await bcrypt.hash(newPassword, salt);

    //update user password
    user.password = newHashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Something occurred! Please try again",
    });
  }
};

module.exports = { registerUser, loginUser, changePassword };
