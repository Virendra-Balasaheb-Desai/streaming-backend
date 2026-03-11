import { Tweet } from "../models/tweet.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const owner = req.userId;
    const { content } = req.body;

    if (!content) throw new ApiError(401, "Tweet content is required.");

    const tweet = await Tweet.create({
        owner,
        content,
    });

    if (!tweet) throw new ApiError(401, "Unable to tweet.");

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet created successfully."));
});

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params;

    if (!userId) throw new ApiError(401, "Unable to get tweets, invalid user");

    const tweets = await Tweet.find({
        owner: userId,
    });

    if (!tweets) throw new ApiError(401, "Unable to get tweets.");

    return res
        .status(200)
        .json(
            new ApiResponse(200, tweets, "User tweets fetched successfully.")
        );
});

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params;
    const { content } = req.body;
    const owner = req.userId;

    if (!content || !content.trim())
        throw new ApiError(401, "Tweet content is required.");

    const existedTweet = await Tweet.findById(tweetId);

    if (!existedTweet) throw new ApiError(401, "Tweet doesn't exists.");

    if (existedTweet.owner != owner)
        throw new ApiError(401, "Unauthorized request.");

    existedTweet.content = content;

    const updatedTweet = await existedTweet.save();

    if (!updatedTweet) throw new ApiError(401, "Unable to update tweet.");

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedTweet, "Tweet updated successfully.")
        );
});

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const owner = req.userId;
    const { tweetId } = req.params;

    const existedTweet = await Tweet.findById(tweetId);

    if (!existedTweet) throw new ApiError(401, "Tweet doesn't exists.");

    if (existedTweet.owner != owner)
        throw new ApiError(401, "Unauthorized request.");

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

    if (!deletedTweet) throw new ApiError(401, "Unable to tweet.");

    return res
        .status(200)
        .json(
            new ApiResponse(200, deletedTweet, "Tweet deleted successfully.")
        );
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
