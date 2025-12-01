import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

export const verifyToken = asyncHandler(async (req, _, next) => {
    const token = req.cookies?.accessToken || req.headers.authorization?.replace("Bearer ", "")

    if (!token) throw new ApiError(401, "Unauthorized request")

    let deocodedPayload;

    try {
        deocodedPayload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    } catch (error) {
        throw new ApiError(401, "Invalid token")
    }

    const userId = deocodedPayload?._id

    req.userId = userId;

    next()
})