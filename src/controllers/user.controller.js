import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // steps for register user logic
  // user register depend on how user schema is defined
  // 1. get the details from frontend(in this case we will get it from postman)
  // 2. validation of email and password
  // 3. check the user already exist or not using: email, username
  // 4. check for images, check for avatar
  // 5. upload them using multer to local then, to cloudinary
  // 6. create user object to create entry in DB
  // 7. check for user creation
  // 8. return response to user
  // 9. after creating data entry, we will send back the response to user but while sending we should remove password and refresh token from the response

  const { fullName, email, username, password } = req.body;

  // we have to make sure that every field is entered by user is not empty
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  // in the if condition above, checking if any fileds are empty
  // if any one of the field is empty, then some will return true here
  // throwing our custom error method (ApiError)

  // checking user already exist or not from DB
  // we have user model which has already connection with db so using that we will do the opertaions
  const isUserExisted = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (isUserExisted) {
    throw new ApiError(409, "User with email or username already exists");
  }
  // findone method to find the one user
  // we are finding whether username or email is already existed
  // findone takes object, in that obj using $or method which takes array of object
  // $or checks if any one of the field is exist or not.
  // if any user exist, throwing customized error saying user exist.

  //check for files(avatar, coverImage) in local

  // middleware adds lot of fields in the request
  // here multer gives accesss to field called files in the request
  // in that we need only path of that files

  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  // there is a problem with above code if user does not upload coverImage as it is not required field
  // If req.files?.coverImage evaluates to undefined, then the code tries to access undefined[0], which throws: TypeError: Cannot read properties of undefined (reading '0')
  // optional chaining prevents errors when trying to access properties on 'undefined' or 'null'.
  // It does not handle cases where you try to access elements of an array ([0]) or perform operations on 'undefined'.
  // so basically with the above code we are accessing undefined[0], when user does not upload coverImage, which leads to throw an error

  // fixing above issue
  let coverImageLocalPath; // this will be undefined, if user does not upload
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files?.coverImage[0]?.path;
  }

  // since avatar is required field we throw the error if missed
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // after storing on local server, uploading files to cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  // again throwing an error if avatar is not present
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  // creating user object in database
  const user = await User.create({
    fullName, // fullName:fullName (es6)
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    //if coverImage is not uploaded, then it will be empty string
    email,
    password,
    username: username.toLowerCase(),
  });
  // console.log(user);
  // avatar is validated as it is required field
  // since avatar variable holds the complete response returned from the cloudinary after upload completed on cloudinary we only take the url of that file
  // since coverImage is not required filed not sure wheter user has uploaded the file or not so we will put option chaining or empty value

  // checking user created succesfuly or not, by using findById
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  // mongodb adds _id to every entry(here for every user created)
  // select Specifies which document fields to include or exclude
  // by default every field is selected
  // but we want to exclude password and refreshtoken from the response we are returning to user after succesful user creation.
  // we have to differentiate fields using space, since we are excluding we use minus symbol

  // throwing error if user created is failed
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // sending response using custom Apiresponse class
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Succefully"));
  // we are sending response from our own customized apiresponse class
});

export { registerUser };
