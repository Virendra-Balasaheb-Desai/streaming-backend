import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import config from "../../config/config.js";

export const uploadOnCloudinary = async (localFilePath) => {
    cloudinary.config({
        cloud_name: config.CLOUDINARY_NAME,
        api_key: config.CLOUDINARY_API_KEY,
        api_secret: config.CLOUDINARY_API_SECRET,
    });
    if (!localFilePath) return null;
    try {
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        console.log("File uploaded to cloudinary");
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath);
        console.log("Cloudinary file upload error : ", error);
        return null;
    }
};

export const deleteFromCloudinary = async (publicId, type = "image") => {
    cloudinary.config({
        cloud_name: config.CLOUDINARY_NAME,
        api_key: config.CLOUDINARY_API_KEY,
        api_secret: config.CLOUDINARY_API_SECRET,
    });
    if (!publicId || !publicId.trim()) return null;
    try {
        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: type,
        });
        console.log("file deleted from cloudinary :", response);
        return response;
    } catch (error) {
        console.log("Cloudinary file deletion error: ", error);
        return null;
    }
};
