import { asyncHandler } from "../utils/asyncHandler.js";

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
});

export { registerUser };
