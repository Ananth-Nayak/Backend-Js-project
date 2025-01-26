import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshBothTokens,
  changeCurrentPassword,
  getCurrentUser,
  updateUserDetails,
  updateAvatar,
  updateCoverImage,
  getUserChannelProfile,
  getWatchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

// before registering user we have to upload the files such as avatar, coverImage in local server using multer, after from there we will upload on cloudinary
// so we import the 'upload' which is given by multer to upload files.
// since multer is a middleware, we are using before the userRegister method(POST)
// fields can take files from different fields(here coverImage, avatar) as array of object (similarly upload.array is used for multiple files for single fields, similarly upload.single for single file)
// in that we specify the field name of files and maximum count of files that field can take from single user
// after this registerUser method is called

router.route("/login").post(loginUser);

// secured routes
router.route("/logout").post(verifyJWT, logoutUser);
// when route hits to /logout post method, it will call verifyJWT to verify the user
// since we wrote 'next()' at the end of verifyJwt method, bcz of it, logoutUser get called next
// this is how we add multiple middleware to a route
router.route("/refresh-token").post(refreshBothTokens);

router.route("/change-password").post(verifyJWT, changeCurrentPassword);

router.route("/current-user").get(verifyJWT, getCurrentUser);

// use patch here, if we used post here it would change all the details
router.route("/update-account").patch(verifyJWT, updateUserDetails);

// we have to first verify the user whether user is logged in or not
// this operation only updates avatar so patch is used and uploading file should be handled by multer middleware
// since we are uploading single file multer will add file(not files) to the request(req.file)
router
  .route("/update-avatar")
  .patch(verifyJWT, upload.single("avatar"), updateAvatar);

router
  .route("/update-cover-image")
  .patch(verifyJWT, upload.single("/coverImage"), updateCoverImage);

// when user goes to any channel's profile
router.route("/c/:username").get(verifyJWT, getUserChannelProfile);

router.route("/history").get(verifyJWT, getWatchHistory);

export default router;
