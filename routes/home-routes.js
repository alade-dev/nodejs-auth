const express = require("express");
const authMiddleware = require("../middleware/auth-middleware");
const router = express.Router();

router.get("/welcome", authMiddleware, (req, res) => {
  const { username, email, role, userId } = req.userInfo;

  res.status(200).json({
    success: true,
    message: "Welcome to the home page",
    user: {
      _id: userId,
      email,
      username,
      role,
    },
  });
});

module.exports = router;
