import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    //file has been uploaded successfully
    // console.log("file is uploaded on cloudinary",uploadResult.url) // the clodinary url where the file is uploaded

    // remove the locally saved temporary file as the files are uploaded on cloudinary succesfuly
    fs.unlinkSync(localFilePath);
    // here unlinking the file synchronously, it means only after removing the file we will move to the next line

    return uploadResult;
    //we have to give result to user after uploading files so we are returning the uploadResult
    // from that if user wants any data from that they can take it
  } catch (error) {
    fs.unlinkSync(localFilePath);
    // remove the locally saved temporary file as the upload operation got failed
  }
};

export { uploadOnCloudinary };
