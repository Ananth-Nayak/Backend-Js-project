import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { verify } from "jsonwebtoken";
import jwt from "jsonwebtoken";

// since access and refresh tokens needs in so much places for user we create method to generate tokens for user
// we could have write this in different file but these tokens only needed while validating user only
// so we created this method inside user controller only
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    // // debugging steps
    // if (!user) throw new ApiError(400, "User Not Found");
    // else console.log("User created successfully");

    const accessToken = user.generateAccessToken();
    // console.log("Access token Granted", accessToken);

    const refreshToken = user.generateRefreshtoken();
    // console.log("reftresh token granted", refreshToken);
    // we generated access tokens and refresh tokens for a user
    // we give access token to user, but we store the refreshtoken in our database

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    console.log("User saved with referesh token");
    //since we are saving the data in user using save, the mongoose model starts to kick in
    //also the password field will, so it asks for password and when we are saving it
    // to avoid it we set validateBeforeSave to false

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

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

const loginUser = asyncHandler(async (req, res) => {
  // get details from frontend(data from req body)
  // check whether user has sent the details empty or not
  // logic for login either with username or email.
  // since user is trying to login, check user is already exist or not
  // password check
  // access and refresh token
  // send cookies
  // return response

  const { email, username, password } = req.body;
  // console.log(req.body);

  // throwing an error if both the username and email is not sent by the user
  if (!(username || email)) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  // finding user either with username or email
  // with this we can give the option to users that they can login with either username or email.

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  //checking password

  // since we already created a function in user model to check the password using bcrypt method we use that
  const isPasswordValid = await user.isPasswordCorrect(password);

  // here we use - 'user', not 'User'.
  // bcz User is model (which contains different users data)
  // but we added the method to isPassword to each and every user so we use the instance of User model that is user

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  // if password is correct then calling method to generate tokens for user by passing userid
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );
  // we are returning access and refresh token from this method
  // in that method we do 'DB' operation like user.save(), so we use await while invoking the method

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  // we could have used above user but when getting that 'user' from DB refresh token was'nt set , it set afterwards.
  // that's why we run anothe query on DB.
  // it's a optional step

  //now we want send access and refresh Token as cookies
  // since we used cookie parser middleware already, we can directly add to the response
  // before sending cookies, we need to create options for cookies
  // options are nothing but object
  // by default cookies can be modified from the frontend to avoid this and to make it secure and modifiable only from server we create options in which httpOnly and secure set to true

  const options = {
    httpOnly: true,
    secure: true,
  };

  return (
    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      // we can add cookies to response like this, bcz of cookie parser
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            user: loggedInUser,
            accessToken,
            refreshToken,
            //though we are sending token in cookies, to handle different use cases we are also sending these tokens in response (it's a good practice)
          },
          "User Logged In Successfully!!"
        )
      )
  );
});

const logoutUser = asyncHandler(async (req, res) => {
  // we cannot directly get the user id and remove them bcz we will not give form to user to logout so that we can get thier user_id by mail or any other field
  // therfor we create a middleware

  // using the middleware we created now we have access to user using req.user
  // now we find the user and remove refreshToken from the user data model
  // and also removing the tokens cookies
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
        //updating user's refreshtoken value to undefined in DB after finding By userId
      },
    },
    {
      new: true, //it returns user's updated value
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options) // name should be same as while creating cookie
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out Successfully"));
});

// when user's access token expires, we will hit user to some endpoint(route),
// from there we re genarate both access and refresh tokens and send it to the user
const refreshBothTokens = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken ||
    req.header("Authorization")?.replace("Bearer ", "");
  // storing refresh token from the cookies in user request

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedRefreshToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    // using refresh secret token public key, we decode the refresh token
    // since we passed user id payload(data) to refreshToken while generating refereshToken
    // now decoded token has user id

    // finding user using the user id we got from refreshtoken
    const user = await User.findById(decodedRefreshToken._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    // if refreshToken from request is not same as user's database then thrwoing error
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(
        401,
        "refresh Token is expired or refresh Token is used"
      );
    }

    // calling generating tokens method to create new token and send it to the user and store it to the user database
    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens();

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookies("accessToken", accessToken, options)
      .cookies("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access Token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  // we are using our own auth middleware,
  // so we get user details from req.user
  const user = await User.findById(req.user?._id);

  // while creating User Schema we have added is password correct method to the each user to check the old password is correct or not
  const isPasswordCorrect = user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid Old Password");
  }

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });
  // before saving user to database, we used pre method which will be called just before saving the user to database, in that if password is not modified then it will call next(), if modified then it will encrypt
  // validatebefore set to false not to check the validation of other fields

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed Succesfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current User fetched Successfully!"));
});

const updateUserDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  // since we need both the details, if any one of them missing we throw an error
  // we can also update by using one field, it's our process which decides the logic that how we want to update the user details, here we need both the details to update
  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName, // => fullName:fullName
        email,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User Data updated successfully!"));
});
// by setting new to true in 3rd argument to findByIdAndUpdate
// it will update user data and then returns the updated data of user here
// and we are storing that in user variable

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshBothTokens,
  getCurrentUser,
  updateUserDetails,
};
