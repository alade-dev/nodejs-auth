const express = require("express");
const authMiddleware = require("../middleware/auth-middleware");
const adminMiddleware = require("../middleware/admin-middleware");
const imageMiddleware = require("../middleware/upload-middleware");
const {
  UploadImage,
  fetchImages,
  deleteImage,
} = require("../controllers/image-controller");
const router = express.Router();

//upload image
router.post(
  "/upload",
  authMiddleware,
  adminMiddleware,
  imageMiddleware.single("image"),
  UploadImage
);
//get all images
router.get("/get", authMiddleware, fetchImages);
router.delete("/delete/:id", authMiddleware, adminMiddleware, deleteImage);

module.exports = router;
