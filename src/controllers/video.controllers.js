import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.models.js"
import { User } from "../models/user.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinaryUpload.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    const sort = sortType === "desc" ? -1 : 1;
    const options =  {
            page : parseInt(page) || 1,
            limit : parseInt(limit) || 10
    }

    if(!userId || !userId.trim()) throw new ApiError(401,"Unable to get user");

    let matching = {
         owner : new mongoose.Types.ObjectId(userId)
    };

    if(query){
        matching.$or = [
            {
                title:{
                    $regex: query, $options:"i"
                }
            },
            {
                description:{
                    $regex: query, $options:"i"
                }
            }           
        ]
    }

    const pipeline = Video.aggregate(
        [
            {
                $match: matching
            },
            {
                $sort:{
                    [sortBy] : sort
                }
            }
        ]
    );

    const paginatedVideos = await Video.aggregatePaginate(pipeline,options);

    if(!paginatedVideos) throw new ApiError(401,"Unable to get videos.");

    return res.status(200).json(new ApiResponse(200,paginatedVideos,"Videos fetched successfully."))
    
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    const owner = req.userId;
    // TODO: get video, upload to cloudinary, create video
    if (!(title || description)) throw new ApiError(401, "Title or description cannot be empty");

    let videoPath;
    if (req.files && Array.isArray(req.files.video) && req.files.video.length > 0)
        videoPath = req.files?.video[0]?.path;

    if (!videoPath) throw new ApiError(401, "Unable to find video file path");

    let thumbnailPath;
    if (req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0)
        thumbnailPath = req.files?.thumbnail[0]?.path;

    if (!thumbnailPath) throw new ApiError(401, "Unable to find thumbnail file path");

    const video = await uploadOnCloudinary(videoPath);

    if (!video) throw new ApiError(401, "Unable to upload video on cloud")

    const thumbnail = await uploadOnCloudinary(thumbnailPath);

    if (!thumbnail) throw new ApiError(401, "Unable to upload thumbnail on cloud")

    const videoData = await Video.create({
        title,
        description,
        owner,
        videoFile: video?.url,
        thumbnail: thumbnail?.url,
        duration: video?.duration
    })

    if (!videoData) throw new ApiError(401, "Unable to upload video")

    return res.status(200).json(new ApiResponse(201, videoData, "Video uploaded successful"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: get video by id
    if (!videoId) throw new ApiError(401, "Unable to load video");

    const videoData = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "VideoOwner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        }
    ])

    if (!videoData) throw new ApiError(401, "Unable to fetch Video");

    return res.status(201).json(new ApiResponse(200, videoData, "Video fetched"))
})

const updateVideoDetails = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const { title, description } = req.body;
    const ownerId = req.userId;

    if (!videoId) throw new ApiError(401, "Unable to get video");

    if (!(title && description)) throw new ApiError(401, "Missing title and description");

    const videoData = await Video.findById(videoId);

    if(ownerId != videoData.owner) throw new ApiError(402,"Unauthorized request");
    
    videoData.title = title;
    videoData.description = description;

    const updatedVideo = await videoData.save();

    if(!updatedVideo) throw new ApiError(401,"Unable to update details");

    return res.status(200).json(new ApiResponse(200,updatedVideo,"Details updated successful"));

})

const updateVideoThumbnail = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const thumbnailPath = req.file?.path;
    const ownerId = req.userId;

    if (!videoId) throw new ApiError(401, "Unable to get video");

    if (!thumbnailPath) throw new ApiError(401, "Unable to find thumbnail path");

    const videoData = await Video.findById(videoId);

    if(ownerId != videoData.owner) throw new ApiError(402,"Unauthorized request");
    
    const uploadedThumbnail = await uploadOnCloudinary(thumbnailPath);
    
    if (!uploadedThumbnail) throw new ApiError(401, "Unable to upload thumbnail on cloud");

    videoData.thumbnail = uploadedThumbnail?.url;

    const updatedThumbnail = await videoData.save();

    if(!updatedThumbnail) throw new ApiError(401,"Unable to update thumbnail");

    return res.status(200).json(new ApiResponse(200,updatedThumbnail,"Thumbnail updated successful"));

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const ownerId = req.userId;
    //TODO: delete video
    if (!videoId) throw new ApiError(401, "Unable to get video");

    const deletedVideo = await Video.findById(videoId);

    const videoData = await Video.findById(videoId);

    if(ownerId != videoData.owner) throw new ApiError(402,"Unauthorized request");    

    const deleteVideo = await Video.findByIdAndDelete(videoId);

    if(!deleteVideo) throw new ApiError(401,"Unable to delete video");

    return res.status(200).json(new ApiResponse(200,deletedVideo,"Video deleted successful"));
 
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const ownerId = req.userId;

    if (!videoId) throw new ApiError(401, "Unable to get video");

    const videoData = await Video.findById(videoId);

    if(ownerId != videoData.owner) throw new ApiError(402,"Unauthorized request");
    
    videoData.isPublised = !(videoData.isPublised);


    const toggledVideo = await videoData.save();

    if(!toggledVideo) throw new ApiError(401,"Unable to toggle publication video");

    return res.status(200).json(new ApiResponse(200,toggledVideo,"Video publication toggled successful"));
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideoDetails,
    updateVideoThumbnail,
    deleteVideo,
    togglePublishStatus
}
