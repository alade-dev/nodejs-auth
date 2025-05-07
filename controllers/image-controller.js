const { uploadToCloudinary } = require("../helpers/cloudinaryHelper");
const Image = require("../models/Image");
const cloudinary = require("../config/cloudinary");

const UploadImage = async (req, res) => {
  try {
    // if file is missing in req object
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File is required, Please upload an image",
      });
    }
    // upload to cloudinary
    const { url, publicId } = await uploadToCloudinary(req.file.path);

    //store the url and publicId along with the user id to the database
    const newlyUploadedImage = new Image({
      url,
      publicId,
      uploadedBy: req.userInfo.userId,
    });

    await newlyUploadedImage.save();

    // deleting the image from local storage
    // fs.unlinkSync(req.file.path)
    res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      image: newlyUploadedImage,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong, please try again",
    });
  }
};

const fetchImages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    const totalImages = await Image.countDocuments();
    const totalPages = Math.ceil(totalImages / limit);

    const sortObj = {};
    sortObj[sortBy] = sortOrder;
    const images = await Image.find().sort(sortObj).skip(skip).limit(limit);
    if (images) {
      res.status(200).json({
        success: true,
        currentPage: page,
        totalPages: totalPages,
        totalImages: totalImages,
        data: images,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong, please try again",
    });
  }
};

const deleteImage = async (req, res) => {
  try {
    const currentImageId = req.params.id;
    const userId = req.userInfo.userId;

    //check out the image ID
    const image = await Image.findById(currentImageId);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    //is image uploaded by current user that uploaded it
    if (image.uploadedBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this image",
      });
    }

    //delete this image from cloudinary storage
    await cloudinary.uploader.destroy(image.publicId);

    //delete the image from mongoDB database
    await Image.findByIdAndDelete(currentImageId);

    res.status(200).json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong, please try again",
    });
  }
};

module.exports = { UploadImage, fetchImages, deleteImage };
