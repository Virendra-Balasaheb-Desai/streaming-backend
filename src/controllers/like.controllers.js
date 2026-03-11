import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: toggle like on video
    const likeBy = req.userId;

    if (!videoId || !videoId.trim())
        throw new ApiError(401, "Unable to get video");

    const liked = await Like.findOne({
        video: videoId,
        likeBy,
    });

    if (!liked) {
        const like = await Like.create({
            video: videoId,
            likeBy,
        });
        if (!like) throw new ApiError(401, "Unable to like the video");
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Video liked successfully."));
    } else {
        const removeLike = await Like.findByIdAndDelete(liked._id);
        if (!removeLike)
            throw new ApiError(401, "Unable to remove like from video");
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Video like removed successfully."));
    }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    //TODO: toggle like on comment
    const likeBy = req.userId;

    if (!commentId || !commentId.trim())
        throw new ApiError(401, "Unable to get comment");

    const liked = await Like.findOne({
        comment: commentId,
        likeBy,
    });

    if (!liked) {
        const like = await Like.create({
            comment: commentId,
            likeBy,
        });
        if (!like) throw new ApiError(401, "Unable to like the comment");
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Comment liked successfully."));
    } else {
        const removeLike = await Like.findByIdAndDelete(liked._id);
        if (!removeLike)
            throw new ApiError(401, "Unable to remove like from comment");
        return res
            .status(200)
            .json(
                new ApiResponse(200, {}, "Comment like removed successfully.")
            );
    }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    //TODO: toggle like on tweet
    const likeBy = req.userId;

    if (!tweetId || !tweetId.trim())
        throw new ApiError(401, "Unable to get tweet");

    const liked = await Like.findOne({
        tweet: tweetId,
        likeBy,
    });

    if (!liked) {
        const like = await Like.create({
            tweet: tweetId,
            likeBy,
        });
        if (!like) throw new ApiError(401, "Unable to like the tweet");
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Tweet liked successfully."));
    } else {
        const removeLike = await Like.findByIdAndDelete(liked._id);
        if (!removeLike)
            throw new ApiError(401, "Unable to remove like from tweet");
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Tweet like removed successfully."));
    }
});

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.userId;

    const likedVideos = await Like.find({
        likeBy: userId,
        video: {
            $exists: true,
        },
    });
    // ).where('video').ne(null || undefined); //works fine

    if (!likedVideos) throw new ApiError(401, "Unable to get liked videos");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                likedVideos,
                "Liked videos fetched successfully."
            )
        );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
