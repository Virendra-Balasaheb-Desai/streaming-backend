import dotenv from "dotenv"

dotenv.config({
    path:"./.env"
})

const config = {
    PORT:process.env.PORT,
    DB_NAME:process.env.DB_NAME,
    MONGODB_URI:process.env.MONGODB_URI,
    CORS_ORIGIN:process.env.CORS_ORIGIN,
    ACCESS_TOKEN_SECRET:process.env.ACCESS_TOKEN_SECRET,
    ACCESS_TOKEN_EXPIRY:process.env.ACCESS_TOKEN_EXPIRY,
    REFRESH_TOKEN_SECRET:process.env.REFRESH_TOKEN_SECRET,
    REFRESH_TOKEN_EXPIRY:process.env.REFRESH_TOKEN_EXPIRY,
    CLOUDINARY_NAME:process.env.CLOUDINARY_NAME,
    CLOUDINARY_API_KEY:process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET:process.env.CLOUDINARY_API_SECRET
}

export default config;