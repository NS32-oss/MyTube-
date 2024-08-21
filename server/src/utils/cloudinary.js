// utils/cloudinary.js

import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (file) => {
  try {
    if (!file) return null;
    const response = await cloudinary.uploader.upload(file, {
      resource_type: "auto",
    });
    fs.unlinkSync(file);
    response.url = response.url.replace("http", "https");
    console.log(response);
    return response;
  } catch (error) {
    fs.unlinkSync(file);
    console.log("Error in uploading file to Cloudinary", error);
    return null;
  }
};

export { uploadOnCloudinary };
