import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {
    uploadOnCloudinary,
    deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateTokens = async (user) => {
    try {
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        if (!accessToken || !refreshToken)
            throw new ApiError(500, "Token generation failed.");

        const userData = await User.findByIdAndUpdate(
            { _id: user._id },
            { $set: { refreshToken: refreshToken } }
        ).select("-password -refreshToken");

        if (!userData) throw new ApiError(501, "Token updation failed");

        return { accessToken, refreshToken, user: userData };
    } catch (error) {
        throw new ApiError(501, "Token generation error");
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const { username, fullName, email, password } = req.body;

    if (
        [username, fullName, email, password].some(
            (field) => field?.trim() === ""
        )
    )
        throw new ApiError(400, "All fields are required");

    const userExists = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (userExists)
        throw new ApiError(
            409,
            "User with username or email is already exists"
        );

    let avatarLocalPath;
    if (
        req.files &&
        Array.isArray(req.files.avatar) &&
        req.files.avatar.length > 0
    )
        avatarLocalPath = req.files?.avatar[0]?.path;

    if (!avatarLocalPath) throw new ApiError(400, "Avatar image is required");

    let coverImageLocalPath;
    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
    )
        coverImageLocalPath = req.files?.coverImage[0]?.path;

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar)
        throw new ApiError(400, "Avatar image is not uploaded try again");

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    const userData = await User.create({
        email,
        password,
        fullName,
        avatar: avatar.url,
        avatarId: avatar.public_id,
        coverImage: coverImage?.url || "",
        coverImageId: coverImage?.public_id || "",
        username: username.toLowerCase(),
    });

    if (!userData) throw new ApiError(500, "User is not able to register");

    delete userData.password;

    return res
        .status(201)
        .json(new ApiResponse(200, userData, "User registered successful"));
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    if (!(email || username))
        throw new ApiError(401, "Username or Email is required.");

    if (!password) throw new ApiError(401, "Password is required.");

    const userExists = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (!userExists)
        throw new ApiError(401, "User doesn't exists, register first.");

    const verifiedUser = await userExists.isPasswordVerify(password);

    if (!verifiedUser) throw new ApiError(401, "Password is incorrect.");

    const userData = await generateTokens(userExists);

    const cookieOptions = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", userData.accessToken, cookieOptions)
        .cookie("refreshToken", userData.refreshToken, cookieOptions)
        .json(new ApiResponse(200, userData, "Login Successfull"));
});

const logoutUser = asyncHandler(async (req, res) => {
    const userId = req.userId;

    await User.findByIdAndUpdate(userId, { $set: { refreshToken: undefined } });

    const cookieOptions = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", "", cookieOptions)
        .cookie("refreshToken", "", cookieOptions)
        .json(new ApiResponse(200, "", "Logout successfull"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) throw new ApiError(401, "Unauthorized request");

    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
        throw new ApiError(401, "Invalid token");
    }

    const userData = await User.findById(decodedToken?._id);

    if (token !== userData.refreshToken)
        throw new ApiError(401, "Unmatched token");

    const user = await generateTokens(userData);

    if (!user) throw new ApiError(401, "Failed to generate token");

    const cookieOptions = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", user.accessToken, cookieOptions)
        .cookie("refreshToken", user.refreshToken, cookieOptions)
        .json(new ApiResponse(200, user, "Access token refreshed."));
});

const changeUserPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword)
        throw new ApiError(400, "Old password or new password is missing");

    const userData = await User.findById(req.userId);

    if (!userData) throw new ApiError(400, "User doesn't exists.");

    const verifiedPassword = await userData.isPasswordVerify(oldPassword);

    if (!verifiedPassword) throw new ApiError(400, "Incorrect old password.");

    userData.password = newPassword;
    await userData.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, "", "Password change successful."));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    const userData = await User.findById(req.userId).select(
        "-password -refreshToken"
    );

    if (!userData) throw new ApiError(400, "User doesn't exist");

    return res
        .status(200)
        .json(new ApiResponse(200, userData, "User fetched successful."));
});

const updateUserAccount = asyncHandler(async (req, res) => {
    const { email, fullName } = req.body;

    if (!email || !fullName)
        throw new ApiError(400, "Email and full name is required");

    const updatedUser = await User.findByIdAndUpdate(
        req.userId,
        {
            $set: {
                email,
                fullName,
            },
        },
        {
            new: true,
        }
    ).select("-password -refreshToken");

    if (!updatedUser) throw new ApiError(500, "User updation failed");

    return res
        .status(200)
        .json(new ApiResponse(200, updatedUser, "User accout updated."));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) throw new ApiError(400, "Unable to find file path.");

    const user = await User.findById(req.userId);

    if (!user) throw new ApiError("Unable to find user");

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar) throw new ApiError(400, "Failed to upload file on cloud.");

    const avatarDeleted = await deleteFromCloudinary(user.avatarId);

    if (!avatarDeleted) console.log("Avatar not deleted from cloud");

    user.avatar = avatar?.url;
    user.avatarId = avatar?.public_id;

    const updatedUser = user.save();

    // const updatedUser = await User.findByIdAndUpdate(req.userId,{ $set : { avatar : avatar?.url}},{new:true})

    if (!updatedUser) throw new ApiError(500, "User avatar updation failed");

    return res
        .status(200)
        .json(new ApiResponse(200, updatedUser, "User avatar updated."));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath)
        throw new ApiError(400, "Unable to find file path.");

    const user = await User.findById(req.userId);

    if (!user) throw new ApiError("Unable to find user");

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage) throw new ApiError(400, "Failed to upload file on cloud.");

    if (user.coverImageId != "") {
        const coverImageDeleted = await deleteFromCloudinary(user.coverImageId);

        if (!coverImageDeleted)
            console.log("Cover image not deleted from cloud");
    }

    user.coverImage = coverImage?.url;
    user.coverImageId = coverImage?.public_id;

    const updatedUser = user.save();

    if (!updatedUser)
        throw new ApiError(500, "User coverImage updation failed");

    return res
        .status(200)
        .json(new ApiResponse(200, updatedUser, "User cover image updated."));
});

const getUserChannelDetails = asyncHandler(async (req, res) => {
    const { username } = req.params;
    console.log(username);

    if (!username?.trim()) throw new ApiError(401, "Username is required");

    const userChannnel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase(),
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribed",
            },
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers",
                },
                subscribedCount: {
                    $size: "$subscribed",
                },
                isSubscriber: {
                    $cond: {
                        if: {
                            $in: [req.userId || 0, "$subscribers.subscriber"],
                        },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $project: {
                fullName: 1,
                email: 1,
                username: 1,
                avatar: 1,
                coverImage: 1,
                subscribersCount: 1,
                subscribedCount: 1,
                isSubscriber: 1,
                createdAt: 1,
            },
        },
    ]);

    if (!userChannnel) throw new ApiError(500, "Unable to fetch details");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                userChannnel[0],
                "Channel details fetched successful."
            )
        );
});

const getUserWatchHistory = asyncHandler(async (req, res) => {
    const history = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.userId),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner",
                            },
                        },
                    },
                ],
            },
        },
    ]);

    if (!history) throw new ApiError(500, "Unable to fetch watch history");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                history[0]?.watchHistory,
                "Watch history fetched successful."
            )
        );
});

const deleteUser = asyncHandler(async (req, res) => {
    const userId = req.userId;

    const deletedUser = await User.findByIdAndDelete({ _id: userId });

    if (deletedUser) {
        const avatarDeleted = await deleteFromCloudinary(deletedUser.avatarId);
        if (!avatarDeleted) console.log("Avatar not deleted from cloud");
        if (deletedUser.coverImageId != "") {
            const coverImageDeleted = await deleteFromCloudinary(
                deletedUser.coverImageId
            );
            if (!coverImageDeleted)
                console.log("Cover image not deleted from cloud");
        }
    }

    const cookieOptions = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", "", cookieOptions)
        .cookie("refreshToken", "", cookieOptions)
        .json(new ApiResponse(200, "", "Deleted user account successfully"));
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeUserPassword,
    getCurrentUser,
    updateUserAccount,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelDetails,
    getUserWatchHistory,
    deleteUser,
};
