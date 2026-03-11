import mongoose from "mongoose";
import { Video } from "../models/video.models.js";
import { Subscription } from "../models/subscription.models.js";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { channel } from "diagnostics_channel";

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const { userId } = req.params;

    if (!userId || !userId.trim())
        throw new ApiError(401, "Unable to get channel");

    const totalVideos = await Video.countDocuments({ owner: userId });

    if (!totalVideos && totalVideos != 0)
        throw new ApiError(401, "Unable to get channel videos");

    const totalLikes = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
            },
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likedVideos",
            },
        },
        {
            $project: {
                likedVideos: 1,
                _id: 0,
            },
        },
        {
            $unwind: {
                path: "$likedVideos",
            },
        },
        {
            $count: "total_docs",
        },
    ]);

    if (!totalLikes)
        throw new ApiError(401, "Unable to get channel videos likes");

    const totalsViews = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
            },
        },
        {
            $group: {
                _id: "$owner",
                total_views: {
                    $sum: "$views",
                },
            },
        },
    ]);

    if (!totalsViews)
        throw new ApiError(401, "Unable to get channel videos views");

    const subscribers = await Subscription.countDocuments({
        channel: userId,
    });

    if (!subscribers && subscribers != 0)
        throw new ApiError(401, "Unable to get channel subscribers");

    const totals = {
        subscribers,
        totalVideos,
        totalsViews: totalsViews[0]?.total_views,
        totalLikes: totalLikes[0]?.total_docs,
    };

    if (!totals) throw new ApiError(401, "Unable to get channel stats");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                totals,
                "Stats of channel is fetched successfully"
            )
        );
});

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const { userId } = req.params;

    if (!userId || !userId.trim())
        throw new ApiError(401, "Unable to get channel");

    const videos = await Video.find({ owner: userId });

    if (!videos) throw new ApiError(401, "Unable to get channel videos");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                videos,
                "Videos of channel is fetched successfully"
            )
        );
});

export { getChannelStats, getChannelVideos };
