import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    uploadOnCloudinary,
    deleteFromCloudinary,
} from "../utils/cloudinary.js";

//getHomePageVideos for home page to All users(public)
const getHomePageVideos = asyncHandler(async (req, res) => {
    // get all videos with pagination infinity scroll and loading videos
    // no serach and querying 
    const pipeline = Video.aggregate([
        {
            $match: {
                isPublised: true,
            },
        },
        {
            $lookup:{
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline:[
                    {
                        $project: {
                            _id: 1,
                            username:1,
                            avatar:1,
                            fullName:1,
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes",
            }
        },
        {
            $addFields: {
                likeCount: {
                    $size: "$likes",
                },
            },
        },
        {
            $project:{
                likes: 0
            }
        },
        {
            $sort: {
                createdAt: -1,
            },
        },
    ]);

    const options = {
        page: 1,
        limit: 20,
    };

    const paginatedVideos = await Video.aggregatePaginate(pipeline, options);

    if (!paginatedVideos) throw new ApiError(401, "Unable to get videos.");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                paginatedVideos,
                "Videos fetched successfully."
            )
        );
    
})


//getVideoBySearch for search page to All users
const getVideoBySearch = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType } = req.query;
    // get all videos based on query, sort, pagination

    const sort = sortType === "desc" ? -1 : 1;
    const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
    };

    let matching = {
        isPublised: true,
    };

    console.log(query)

    if (query) {
        matching.$or = [
            {
                title: {
                    $regex: query,
                    $options: "i",
                },
            },
            {
                description: {
                    $regex: query,
                    $options: "i",
                },
            },
        ];
    }
    

    const pipeline = Video.aggregate([
        {
            $match: matching,
        },
        {
            $lookup:{
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline:[
                    {
                        $project: {
                            _id: 1,
                            username:1,
                            avatar:1,
                            fullName:1,
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes",
            }
        },
        {
            $addFields: {
                likeCount: {
                    $size: "$likes",
                },
            },
        },
        {
            $project:{
                likes: 0
            }
        },
        {
            $sort: {
                [sortBy]: sort,
            },
        },
    ]);

    const paginatedVideos = await Video.aggregatePaginate(pipeline, options);

    if (!paginatedVideos) throw new ApiError(401, "Unable to get videos.");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                paginatedVideos,
                "Videos fetched successfully."
            )
        );


})


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    //TODO: get all videos based on query, sort, pagination

    const sort = sortType === "desc" ? -1 : 1;
    const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
    };

    if (!userId || !userId.trim())
        throw new ApiError(401, "Unable to get user");

    let matching = {
        owner: new mongoose.Types.ObjectId(userId),
    };

    if (query) {
        matching.$or = [
            {
                title: {
                    $regex: query,
                    $options: "i",
                },
            },
            {
                description: {
                    $regex: query,
                    $options: "i",
                },
            },
        ];
    }

    const pipeline = Video.aggregate([
        {
            $match: matching,
        },
        {
            $lookup:{
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline:[
                    {
                        $project: {
                            _id: 1,
                            username:1,
                            avatar:1,
                            fullName:1,
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes",
            }
        },
        {
            $addFields: {
                likeCount: {
                    $size: "$likes",
                },
            },
        },
        {
            $project:{
                likes: 0
            }
        },
        {
            $sort: {
                [sortBy]: sort,
            },
        },
    ]);

    const paginatedVideos = await Video.aggregatePaginate(pipeline, options);

    if (!paginatedVideos) throw new ApiError(401, "Unable to get videos.");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                paginatedVideos,
                "Videos fetched successfully."
            )
        );
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    const owner = req.userId;
    // TODO: get video, upload to cloudinary, create video
    if (!(title || description))
        throw new ApiError(401, "Title or description cannot be empty");

    let videoPath;
    if (
        req.files &&
        Array.isArray(req.files.video) &&
        req.files.video.length > 0
    )
        videoPath = req.files?.video[0]?.path;

    if (!videoPath) throw new ApiError(401, "Unable to find video file path");

    let thumbnailPath;
    if (
        req.files &&
        Array.isArray(req.files.thumbnail) &&
        req.files.thumbnail.length > 0
    )
        thumbnailPath = req.files?.thumbnail[0]?.path;

    if (!thumbnailPath)
        throw new ApiError(401, "Unable to find thumbnail file path");

    const video = await uploadOnCloudinary(videoPath);

    if (!video) throw new ApiError(401, "Unable to upload video on cloud");

    const thumbnail = await uploadOnCloudinary(thumbnailPath);

    if (!thumbnail)
        throw new ApiError(401, "Unable to upload thumbnail on cloud");

    const videoData = await Video.create({
        title,
        description,
        owner,
        videoFile: video?.url,
        videoFileId: video?.public_id,
        thumbnail: thumbnail?.url,
        thumbnailId: thumbnail?.public_id,
        duration: video?.duration,
    });

    if (!videoData) throw new ApiError(401, "Unable to upload video");

    return res
        .status(200)
        .json(new ApiResponse(201, videoData, "Video uploaded successful"));
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: get video by id
    if (!videoId) throw new ApiError(401, "Unable to load video");

    const videoData = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [           
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers"
                        },
                    },
                    {
                        $project: {
                            username: 1,
                            avatar: 1,
                            fullName: 1,
                            subscribers: {$size: "$subscribers"},
                            isSubscribed: { $in: [req.userId? new mongoose.Types.ObjectId(req.userId) : 0, "$subscribers.subscriber"] },
                        },
                    },
                ],
            },
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes",
            },
        },
        // {
        //     $lookup: {
        //         from: "comments",
        //         localField: "_id",
        //         foreignField: "video",
        //         as: "comments",
        //         pipeline: [
        //             {
        //                 $lookup: {
        //                     from: "users",
        //                     localField: "owner",
        //                     foreignField: "_id",
        //                     as: "commentOwner",
        //                     pipeline: [
        //                         {
        //                             $project: {
        //                                 _id:1,
        //                                 username: 1,
        //                                 avatar: 1,
        //                                 fullName: 1,
        //                             },
        //                         },
        //                     ],
        //                 },
        //             },
        //             {
        //                 $project:{
        //                     updatedAt:0
        //                 }
        //             }
        //         ],
        //     },
        // },
        {
            $addFields: {
                owner: { $arrayElemAt: ["$owner", 0]}
            }
        },
        {
            $addFields: {
                likeCount : { $size: "$likes"}
            }
        },
        {
            $addFields: {
                liked : { $in: [req.userId? new mongoose.Types.ObjectId(req.userId) : 0, "$likes.likeBy"] },
            }
        },
        {
            $project:{
                likes: 0
            }
        }
    ]);

    if (!videoData) throw new ApiError(401, "Unable to fetch Video");

    return res
        .status(200)
        .json(new ApiResponse(200, videoData, "Video fetched"));
});

const updateVideoDetails = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: update video details like title, description, thumbnail
    const { title, description } = req.body;
    const ownerId = req.userId;

    if (!videoId) throw new ApiError(401, "Unable to get video");

    if (!(title && description))
        throw new ApiError(401, "Missing title and description");

    const videoData = await Video.findById(videoId);

    if (ownerId != videoData.owner)
        throw new ApiError(402, "Unauthorized request");

    videoData.title = title;
    videoData.description = description;

    const updatedVideo = await videoData.save();

    if (!updatedVideo) throw new ApiError(401, "Unable to update details");

    return res
        .status(200)
        .json(new ApiResponse(200, updatedVideo, "Details updated successful"));
});

const updateVideoThumbnail = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const thumbnailPath = req.file?.path;
    const ownerId = req.userId;

    if (!videoId) throw new ApiError(401, "Unable to get video");

    if (!thumbnailPath)
        throw new ApiError(401, "Unable to find thumbnail path");

    const videoData = await Video.findById(videoId);

    if (!videoData) throw new ApiError("Unable to find video");

    if (ownerId != videoData.owner)
        throw new ApiError(402, "Unauthorized request");

    const uploadedThumbnail = await uploadOnCloudinary(thumbnailPath);

    if (!uploadedThumbnail)
        throw new ApiError(401, "Unable to upload thumbnail on cloud");

    const thumbnailDeleted = await deleteFromCloudinary(videoData.thumbnailId);

    if (!thumbnailDeleted) console.log("Thumbnail not deleted from cloud");

    videoData.thumbnailId = uploadedThumbnail?.public_id;

    videoData.thumbnail = uploadedThumbnail?.url;

    const updatedThumbnail = await videoData.save();

    if (!updatedThumbnail)
        throw new ApiError(401, "Unable to update thumbnail");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedThumbnail,
                "Thumbnail updated successful"
            )
        );
});

const updateVideoView = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: update video view
    if (!videoId) throw new ApiError(401, "Unable to get video");

    const videoData = await Video.findById(videoId);

    if (!videoData) throw new ApiError("Unable to find video");

    videoData.views += 1;

    const updatedVideo = await videoData.save();

    if (!updatedVideo) throw new ApiError(401, "Unable to update video views");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {views : updatedVideo.views},
                "Video views updated successful"
            )
        );
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const ownerId = req.userId;
    //TODO: delete video
    if (!videoId) throw new ApiError(401, "Unable to get video");

    const videoData = await Video.findById(videoId);

    if (!videoData) throw new ApiError("Unable to find video");

    if (ownerId != videoData.owner)
        throw new ApiError(402, "Unauthorized request");

    const deletedVideo = await Video.findByIdAndDelete(videoId);

    if (!deletedVideo) throw new ApiError(401, "Unable to delete video");

    const thumbnailDeleted = await deleteFromCloudinary(
        deletedVideo.thumbnailId
    );

    if (!thumbnailDeleted) console.log("Thumbnail not deleted from cloud");

    const videoFileDeleted = await deleteFromCloudinary(
        deletedVideo.videoFileId,
        "video"
    );

    if (!videoFileDeleted) console.log("Video not deleted from cloud");

    return res
        .status(200)
        .json(new ApiResponse(200, deletedVideo, "Video deleted successful"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const ownerId = req.userId;

    if (!videoId) throw new ApiError(401, "Unable to get video");

    const videoData = await Video.findById(videoId);

    if (ownerId != videoData.owner)
        throw new ApiError(402, "Unauthorized request");

    videoData.isPublised = !videoData.isPublised;

    const toggledVideo = await videoData.save();

    if (!toggledVideo)
        throw new ApiError(401, "Unable to toggle publication video");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                toggledVideo,
                "Video publication toggled successful"
            )
        );
});

export {
    getHomePageVideos,
    getVideoBySearch,
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideoDetails,
    updateVideoThumbnail,
    updateVideoView,
    deleteVideo,
    togglePublishStatus,
};
