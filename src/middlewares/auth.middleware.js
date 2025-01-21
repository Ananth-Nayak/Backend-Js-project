import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

// this middleware is created to verify whether user is exist or not
// this is very helpful in many things such as logging out of user.
// since we added cookies using middleware(app.use(cookie-parser())), now we can access using both by req and res

// we have to verify user using his token that we added to user's cookies

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    // we are accessing req.cookies.accessToken bcz we added accessToken like this at the time of user log in
    // since there is chance of user may have sending tokens from headers also as android application cannot store cookies
    // in this case most of the time it will be "Authorization" header.
    // like this Authorization: Bearer <token>
    // we only want token in the authorization header so we replaced all other with empty string

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    // we are verifying acess token using access token secret(public key)
    // while creating access tokens for user using generateAccessToken method in schema we pass the user_id, email and access secret token (public key) to user

    // now decodedToken has user id of user after verifying the access token
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      // frontend discussion in next chapter here
      throw new ApiError(401, "Invalid Access Token");
    }

    // if everything goes well, we add user info to the request object with user key
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access Token");
  }
});
