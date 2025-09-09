import {v2 as cloudinary} from 'cloudinary';

export const connectCloudinary = () => {
    try {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_NAMES,
            api_key: process.env.CLOUDINARY_API_KEYS,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });

        if (!process.env.CLOUDINARY_NAMES || !process.env.CLOUDINARY_API_KEYS || !process.env.CLOUDINARY_API_SECRET) {
            throw new Error("Cloudinary credentials are missing or invalid. Please check your enviroment variables.");
        }

        console.log("Cloudinary connected");
    } catch (error) {
        console.error("Error connecting to cloudinary: ", error);
        process.exit(1);
    }
};